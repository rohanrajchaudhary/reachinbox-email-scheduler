export interface Email {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";
  errorMessage?: string | null;
  senderEmail?: string | null;
}

export interface ScheduleEmailResponse {
  success: boolean;
  message: string;
  data: Email[];
}