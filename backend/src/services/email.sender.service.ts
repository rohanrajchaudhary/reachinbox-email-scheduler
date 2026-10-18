import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASSWORD,
  },
});

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  body,
  from,
}: SendEmailInput) {
  if (!process.env.ETHEREAL_USER || !process.env.ETHEREAL_PASSWORD) {
    throw new Error(
      "Ethereal SMTP credentials are missing from environment variables"
    );
  }

  const info = await transporter.sendMail({
    from: from || process.env.ETHEREAL_USER,
    to,
    subject,
    text: body,
    html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</div>`,
  });

  console.log("📧 Email sent successfully");
  console.log(`   To: ${to}`);
  console.log(`   Message ID: ${info.messageId}`);

  return info;
}