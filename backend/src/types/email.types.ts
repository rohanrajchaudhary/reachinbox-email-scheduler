export interface EmailRecipient {
  email: string;
}

export interface ScheduleEmailInput {
  recipients: EmailRecipient[];
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  senderEmail?: string;
}

export interface EmailJobData {
  emailRequestId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail?: string;
  hourlyLimit: number;
  delayBetweenEmails: number;
}