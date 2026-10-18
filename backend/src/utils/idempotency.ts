import { createHash } from "crypto";

export function generateIdempotencyKey(
  userId: string,
  recipientEmail: string,
  subject: string,
  scheduledAt: Date
): string {
  const value = [
    userId,
    recipientEmail.trim().toLowerCase(),
    subject.trim(),
    scheduledAt.toISOString(),
  ].join("|");

  return createHash("sha256").update(value).digest("hex");
}