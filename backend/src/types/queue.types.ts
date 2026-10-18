export interface EmailQueueJob {
  emailRequestId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail?: string;
  hourlyLimit: number;
  delayBetweenEmails: number;
}