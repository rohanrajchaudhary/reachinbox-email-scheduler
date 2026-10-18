import prisma from "../config/database";
import { generateIdempotencyKey } from "../utils/idempotency";
import { indexEmail } from "./elasticsearch.service";

interface CreateEmailRequestInput {
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  senderEmail?: string;
}

export async function createEmailRequest(
  input: CreateEmailRequestInput
) {
  const idempotencyKey = generateIdempotencyKey(
    input.userId,
    input.recipientEmail,
    input.subject,
    input.scheduledAt
  );

  const existingRequest =
    await prisma.emailRequest.findUnique({
      where: {
        idempotencyKey,
      },
    });

  if (existingRequest) {
    return {
      emailRequest: existingRequest,
      created: false,
    };
  }

  const emailRequest =
    await prisma.emailRequest.create({
      data: {
        userId: input.userId,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        body: input.body,
        scheduledAt: input.scheduledAt,
        senderEmail: input.senderEmail,
        idempotencyKey,
      },
    });

  /*
   * Elasticsearch failure should not prevent the
   * email request from being persisted in PostgreSQL.
   *
   * PostgreSQL remains the source of truth.
   */
  try {
    await indexEmail({
      id: emailRequest.id,
      userId: emailRequest.userId,
      recipientEmail: emailRequest.recipientEmail,
      subject: emailRequest.subject,
      body: emailRequest.body,
      scheduledAt: emailRequest.scheduledAt,
      sentAt: emailRequest.sentAt,
      status: emailRequest.status,
    });
  } catch (error) {
    console.error(
      "Elasticsearch indexing failed:",
      error
    );
  }

  return {
    emailRequest,
    created: true,
  };
}

export async function getScheduledEmails(
  userId: string
) {
  return prisma.emailRequest.findMany({
    where: {
      userId,
      status: "SCHEDULED",
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });
}

export async function getSentEmails(
  userId: string
) {
  return prisma.emailRequest.findMany({
    where: {
      userId,
      status: {
        in: ["SENT", "FAILED"],
      },
    },
    orderBy: {
      sentAt: "desc",
    },
  });
}