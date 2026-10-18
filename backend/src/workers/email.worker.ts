import { Worker, Job } from "bullmq";

import prisma from "../config/database";
import env from "../config/env";
import emailQueue from "../queues/email.queue";

import { sendEmail } from "../services/email.sender.service";

import {
  tryConsumeRateLimit,
  getNextHourTimestamp,
} from "../services/rate-limit.service";

import { sendSlackNotification } from "../services/slack.service";
import { indexEmail } from "../services/elasticsearch.service";

function isProviderRateLimitError(
  error: unknown
): boolean {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return (
    message.includes("429") ||
    message.toLowerCase().includes("rate limited")
  );
}

const worker = new Worker(
  "email-scheduler",

  async (job: Job) => {
    const {
      emailRequestId,
      recipientEmail,
      subject,
      body,
      senderEmail,
      hourlyLimit,
      delayBetweenEmails,
    } = job.data;

    const emailRequest =
      await prisma.emailRequest.findUnique({
        where: {
          id: emailRequestId,
        },
        include: {
          user: true,
        },
      });

    if (!emailRequest) {
      throw new Error(
        `Email request ${emailRequestId} not found`
      );
    }

    /*
     * Idempotency:
     * Never send the same email again if it is already SENT.
     */
    if (emailRequest.status === "SENT") {
      console.log(
        `Email ${emailRequestId} already sent. Skipping.`
      );

      return;
    }

    const sender =
      senderEmail ||
      emailRequest.senderEmail ||
      process.env.ETHEREAL_USER;

    if (!sender) {
      throw new Error(
        "Sender email is required. Configure ETHEREAL_USER in environment variables."
      );
    }

    /*
     * ---------------------------------------------------------
     * Minimum delay between individual emails
     * ---------------------------------------------------------
     */

    if (Number(delayBetweenEmails) > 0) {
      const latestSent =
        await prisma.emailRequest.findFirst({
          where: {
            userId: emailRequest.userId,
            status: "SENT",
            senderEmail: sender,
          },
          orderBy: {
            sentAt: "desc",
          },
        });

      if (latestSent?.sentAt) {
        const nextAllowedTime =
          latestSent.sentAt.getTime() +
          Number(delayBetweenEmails) * 1000;

        if (Date.now() < nextAllowedTime) {
          const delay =
            nextAllowedTime - Date.now();

          console.log(
            `⏳ Minimum delay active for ${recipientEmail}. Rescheduling.`
          );

          const newJob =
            await emailQueue.add(
              "send-email",
              job.data,
              {
                jobId:
                  `email-${emailRequestId}-delay-${nextAllowedTime}`,
                delay,
                attempts: 1,
                removeOnComplete: false,
                removeOnFail: false,
              }
            );

          await prisma.emailRequest.update({
            where: {
              id: emailRequestId,
            },
            data: {
              scheduledAt:
                new Date(nextAllowedTime),
              status: "SCHEDULED",
              jobId: String(newJob.id),
            },
          });

          return;
        }
      }
    }

    /*
     * ---------------------------------------------------------
     * Redis-backed hourly rate limit
     * ---------------------------------------------------------
     */

    const allowed =
      await tryConsumeRateLimit(
        sender,
        Number(hourlyLimit) || 100
      );

    if (!allowed) {
      const nextHourTimestamp =
        getNextHourTimestamp();

      const nextHour =
        new Date(nextHourTimestamp);

      console.log(
        `⚠️ Hourly limit reached for ${sender}. Rescheduling ${emailRequestId}.`
      );

      await prisma.emailRequest.update({
        where: {
          id: emailRequestId,
        },
        data: {
          scheduledAt: nextHour,
          status: "SCHEDULED",
        },
      });

      await sendSlackNotification(
        emailRequest.user.slackToken,
        `⚠️ ReachInbox hourly email limit reached for ${sender}. Email ${recipientEmail} has been rescheduled to the next hour.`
      );

      const newJob =
        await emailQueue.add(
          "send-email",
          job.data,
          {
            jobId:
              `email-${emailRequestId}-hour-${nextHourTimestamp}`,
            delay: Math.max(
              0,
              nextHourTimestamp - Date.now()
            ),
            attempts: 1,
            removeOnComplete: false,
            removeOnFail: false,
          }
        );

      await prisma.emailRequest.update({
        where: {
          id: emailRequestId,
        },
        data: {
          jobId: String(newJob.id),
          status: "SCHEDULED",
        },
      });

      return;
    }

    /*
     * ---------------------------------------------------------
     * Mark email as PROCESSING
     * ---------------------------------------------------------
     */

    await prisma.emailRequest.update({
      where: {
        id: emailRequestId,
      },
      data: {
        status: "PROCESSING",
        senderEmail: sender,
      },
    });

    /*
     * ---------------------------------------------------------
     * Send email
     * ---------------------------------------------------------
     */

    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        body,
        from: sender,
      });

      /*
       * IMPORTANT:
       *
       * SMTP succeeded.
       * Therefore the email is SENT.
       *
       * We update PostgreSQL BEFORE Elasticsearch.
       * Elasticsearch can never change SENT into FAILED.
       */

      const sentAt = new Date();

      const updatedEmail =
        await prisma.emailRequest.update({
          where: {
            id: emailRequestId,
          },
          data: {
            status: "SENT",
            sentAt,
            senderEmail: sender,
            errorMessage: null,
          },
        });

      console.log(
        `✅ Email sent successfully: ${recipientEmail}`
      );

      /*
       * -------------------------------------------------------
       * Elasticsearch indexing
       * -------------------------------------------------------
       *
       * Elasticsearch is not part of email delivery.
       * If Elasticsearch fails, the email MUST remain SENT.
       */

      try {
        await indexEmail(updatedEmail);

        console.log(
          `🔎 Email indexed successfully: ${emailRequestId}`
        );
      } catch (indexError) {
        console.error(
          `⚠️ Elasticsearch indexing failed for ${emailRequestId}. Email remains SENT.`,
          indexError
        );
      }

      /*
       * Very important:
       * Do NOT throw after successful SMTP delivery.
       */
      return;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown email error";

      /*
       * -------------------------------------------------------
       * SMTP provider rate limit
       * -------------------------------------------------------
       */

      if (
        isProviderRateLimitError(error)
      ) {
        const retryDelay =
          5 * 60 * 1000;

        const retryAt =
          Date.now() + retryDelay;

        console.warn(
          `⚠️ SMTP provider rate limited ${recipientEmail}. Rescheduling for ${new Date(
            retryAt
          ).toISOString()}`
        );

        const retryJob =
          await emailQueue.add(
            "send-email",
            job.data,
            {
              jobId:
                `email-${emailRequestId}-smtp-${retryAt}`,
              delay: retryDelay,
              attempts: 1,
              removeOnComplete: false,
              removeOnFail: false,
            }
          );

        await prisma.emailRequest.update({
          where: {
            id: emailRequestId,
          },
          data: {
            status: "SCHEDULED",
            scheduledAt:
              new Date(retryAt),
            senderEmail: sender,
            errorMessage:
              "SMTP provider rate limited the request. Email rescheduled automatically.",
            jobId: String(retryJob.id),
          },
        });

        console.log(
          `🔄 Email ${emailRequestId} rescheduled after SMTP rate limit.`
        );

        return;
      }

      /*
       * -------------------------------------------------------
       * Actual SMTP/application failure
       * -------------------------------------------------------
       *
       * This is a genuine email failure.
       */

      const failedEmail =
        await prisma.emailRequest.update({
          where: {
            id: emailRequestId,
          },
          data: {
            status: "FAILED",
            errorMessage: message,
            senderEmail: sender,
          },
        });

      /*
       * Elasticsearch failure must NOT hide the
       * original SMTP/application error.
       */

      try {
        await indexEmail(failedEmail);
      } catch (indexError) {
        console.error(
          `⚠️ Failed email could not be indexed: ${emailRequestId}`,
          indexError
        );
      }

      console.error(
        `❌ Email job failed: ${emailRequestId}`,
        message
      );

      throw error;
    }
  },

  {
    connection: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },

    concurrency:
      Number(
        process.env.WORKER_CONCURRENCY
      ) || 5,
  }
);

worker.on(
  "completed",
  (job) => {
    console.log(
      `✅ Job completed: ${job.id}`
    );
  }
);

worker.on(
  "failed",
  (job, error) => {
    console.error(
      `❌ Job failed: ${job?.id}`,
      error.message
    );
  }
);

worker.on(
  "error",
  (error) => {
    console.error(
      "❌ Worker error:",
      error
    );
  }
);

console.log(
  `📧 Email worker started with concurrency ${
    Number(
      process.env.WORKER_CONCURRENCY
    ) || 5
  }`
);