import { Response } from "express";
import { randomUUID } from "crypto";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { parseEmailList } from "../utils/csv-parser";
import { isValidEmail } from "../utils/email-validator";
import { generateIdempotencyKey } from "../utils/idempotency";

import {
  getScheduledEmails,
  getSentEmails,
} from "../services/email.service";

import { scheduleEmailsBulk } from "../services/scheduler.service";
import { searchEmails } from "../services/elasticsearch.service";
import prisma from "../config/database";

interface PreparedEmail {
  id: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  senderEmail: string | null;
  status: "SCHEDULED";
  idempotencyKey: string;
}

export async function scheduleEmails(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      subject,
      body,
      startTime,
      delayBetweenEmails,
      hourlyLimit,
      senderEmail,
    } = req.body;

    if (!subject || !body || !startTime) {
      return res.status(400).json({
        success: false,
        message: "Subject, body and start time are required",
      });
    }

    let emails: string[] = [];

    if (req.file) {
      const fileContent = req.file.buffer.toString("utf-8");
      emails = parseEmailList(fileContent);
    } else if (req.body.emails) {
      emails = parseEmailList(req.body.emails);
    }

    if (emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses found",
      });
    }

    const startDate = new Date(startTime);

    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time",
      });
    }

    const delay = Math.max(
      0,
      Number(delayBetweenEmails) || 0
    );

    const limit = Math.max(
      1,
      Number(hourlyLimit) || 100
    );

    const preparedEmails: PreparedEmail[] = [];

    for (let index = 0; index < emails.length; index++) {
      const normalizedEmail = emails[index]
        .trim()
        .toLowerCase();

      if (!isValidEmail(normalizedEmail)) {
        continue;
      }

      const scheduledAt = new Date(
        startDate.getTime() +
          index * delay * 1000
      );

      const idempotencyKey =
        generateIdempotencyKey(
          req.userId,
          normalizedEmail,
          subject,
          scheduledAt
        );

      preparedEmails.push({
        id: randomUUID(),
        userId: req.userId,
        recipientEmail: normalizedEmail,
        subject,
        body,
        scheduledAt,
        senderEmail: senderEmail || null,
        status: "SCHEDULED",
        idempotencyKey,
      });
    }

    if (preparedEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses found",
      });
    }

    /*
     * Bulk database insert.
     *
     * If an email request with the same idempotency key
     * already exists, PostgreSQL skips that duplicate.
     */
    await prisma.emailRequest.createMany({
      data: preparedEmails,
      skipDuplicates: true,
    });

    /*
     * Fetch the records using their idempotency keys.
     * This works for both newly-created and previously-existing
     * idempotent requests.
     */
    const idempotencyKeys = preparedEmails.map(
      (item) => item.idempotencyKey
    );

    const allRequests =
      await prisma.emailRequest.findMany({
        where: {
          userId: req.userId,
          idempotencyKey: {
            in: idempotencyKeys,
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });

    /*
     * Only requests which don't already have a BullMQ job
     * need to be added to the queue.
     */
    const requestsToQueue =
      allRequests.filter(
        (request) => !request.jobId
      );

    const bulkQueueItems =
      requestsToQueue.map((request) => ({
        emailRequestId: request.id,
        recipientEmail: request.recipientEmail,
        subject: request.subject,
        body: request.body,
        senderEmail:
          request.senderEmail || undefined,
        hourlyLimit: limit,
        delayBetweenEmails: delay,
        scheduledAt: request.scheduledAt,
      }));

    /*
     * One BullMQ addBulk() operation instead of
     * hundreds/thousands of individual queue.add() calls.
     */
    if (bulkQueueItems.length > 0) {
      await scheduleEmailsBulk(
        bulkQueueItems
      );
    }

    /*
     * Return the final records.
     */
    const finalRequests =
      await prisma.emailRequest.findMany({
        where: {
          userId: req.userId,
          idempotencyKey: {
            in: idempotencyKeys,
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });

    return res.status(201).json({
      success: true,
      message: `${finalRequests.length} emails scheduled successfully`,
      data: finalRequests,
      hourlyLimit: limit,
      delayBetweenEmails: delay,
    });
  } catch (error) {
    console.error(
      "Schedule emails error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to schedule emails",
    });
  }
}

export async function searchEmailController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const query =
      typeof req.query.q === "string"
        ? req.query.q
        : "";

    const results = await searchEmails(
      query,
      req.userId
    );

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(
      "Search emails error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to search emails",
    });
  }
}

export async function getScheduled(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const emails =
      await getScheduledEmails(req.userId);

    return res.status(200).json({
      success: true,
      data: emails,
    });
  } catch (error) {
    console.error(
      "Get scheduled emails error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled emails",
    });
  }
}

export async function getSent(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const emails =
      await getSentEmails(req.userId);

    return res.status(200).json({
      success: true,
      data: emails,
    });
  } catch (error) {
    console.error(
      "Get sent emails error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sent emails",
    });
  }
}