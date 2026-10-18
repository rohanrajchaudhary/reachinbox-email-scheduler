import { Queue } from "bullmq";
import prisma from "../config/database";
import env from "../config/env";
import { EmailJobData } from "../types/email.types";

const emailQueue = new Queue("email-scheduler", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

export default emailQueue;

export async function scheduleEmail(
  data: EmailJobData,
  scheduledAt: Date
) {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  const jobId = `email-${data.emailRequestId}`;

  const existingJob = await emailQueue.getJob(jobId);

  if (existingJob) {
    return existingJob;
  }

  const job = await emailQueue.add("send-email", data, {
    jobId,
    delay,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  });

  await prisma.emailRequest.update({
    where: {
      id: data.emailRequestId,
    },
    data: {
      jobId: String(job.id),
    },
  });

  return job;
}

export interface BulkScheduleItem {
  emailRequestId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail?: string;
  hourlyLimit: number;
  delayBetweenEmails: number;
  scheduledAt: Date;
}

export async function scheduleEmailsBulk(
  items: BulkScheduleItem[]
) {
  if (items.length === 0) {
    return [];
  }

  const jobs = items.map((item) => {
    const delay = Math.max(
      0,
      item.scheduledAt.getTime() - Date.now()
    );

    return {
      name: "send-email",
      data: {
        emailRequestId: item.emailRequestId,
        recipientEmail: item.recipientEmail,
        subject: item.subject,
        body: item.body,
        senderEmail: item.senderEmail,
        hourlyLimit: item.hourlyLimit,
        delayBetweenEmails: item.delayBetweenEmails,
      },
      opts: {
        jobId: `email-${item.emailRequestId}`,
        delay,
        attempts: 3,
        backoff: {
          type: "exponential" as const,
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    };
  });

  const createdJobs = await emailQueue.addBulk(jobs);

  await prisma.$transaction(
    createdJobs.map((job) =>
      prisma.emailRequest.update({
        where: {
          id: String(job.data.emailRequestId),
        },
        data: {
          jobId: String(job.id),
        },
      })
    )
  );

  return createdJobs;
}