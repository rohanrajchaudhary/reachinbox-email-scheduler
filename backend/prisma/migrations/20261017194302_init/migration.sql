-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "slackToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "EmailStatus" NOT NULL DEFAULT 'SCHEDULED',
    "errorMessage" TEXT,
    "senderEmail" TEXT,
    "jobId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRequest_jobId_key" ON "EmailRequest"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailRequest_idempotencyKey_key" ON "EmailRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailRequest_userId_idx" ON "EmailRequest"("userId");

-- CreateIndex
CREATE INDEX "EmailRequest_status_idx" ON "EmailRequest"("status");

-- CreateIndex
CREATE INDEX "EmailRequest_scheduledAt_idx" ON "EmailRequest"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailRequest_recipientEmail_idx" ON "EmailRequest"("recipientEmail");

-- AddForeignKey
ALTER TABLE "EmailRequest" ADD CONSTRAINT "EmailRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
