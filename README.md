# ReachInbox Mail Scheduler

A production-style full-stack email scheduling application built for the ReachInbox hiring assignment.

The application allows authenticated users to upload recipient lists, schedule emails with configurable delays and hourly limits, process emails asynchronously using BullMQ and Redis, persist scheduling state in PostgreSQL, index/search email records using Elasticsearch, and receive Slack notifications when hourly sending limits are reached.

---

## Features

### Authentication
- Google OAuth 2.0 login
- JWT-based authentication after Google login
- Protected backend APIs
- User profile with name, email and avatar
- Logout support

### Email Scheduling
- Compose emails with subject and body
- Upload CSV/TXT recipient lists
- Automatic email extraction and validation
- Duplicate email removal
- Configurable start time
- Configurable delay between individual emails
- Configurable hourly sending limit
- Bulk scheduling using BullMQ delayed jobs

### Reliable Background Processing
- BullMQ + Redis based asynchronous email processing
- Configurable worker concurrency
- Persistent jobs across application restarts
- Database-backed email request state
- Idempotency keys to prevent duplicate scheduling
- Existing completed emails are skipped by the worker
- Failed jobs are tracked in PostgreSQL

### Rate Limiting
- Redis-backed hourly rate limiter
- Atomic Redis operation for safe concurrent workers
- Configurable hourly limit
- When the hourly limit is reached:
  - Email is not dropped
  - Email is rescheduled for the next hour
  - Slack notification is sent
- Minimum delay between individual email sends
- SMTP provider rate-limit handling with automatic rescheduling

### Email Delivery
- Ethereal SMTP integration
- Email delivery through Nodemailer
- Sender email support through the configured SMTP account
- SMTP provider `429` rate-limit handling
- Failed email state and error message persistence

### Search and Monitoring
- Elasticsearch indexing for email records
- Search API for scheduled/sent email records
- BullMQ dashboard using Bull Board
- Scheduled Emails dashboard
- Sent Emails dashboard

### Slack Integration
- Real Slack OAuth connection
- Incoming webhook obtained through Slack OAuth
- Webhook stored for the authenticated user
- Actual Slack notification when the configured hourly limit is reached
- Safe behavior when Slack is not connected
- Slack can be connected/reconnected without redeploying the application

---

# Architecture

```text
                         ┌──────────────────────┐
                         │      React App       │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP / JWT
                                    ▼
                         ┌──────────────────────┐
                         │    Express API       │
                         │   TypeScript Backend │
                         └───────┬──────┬───────┘
                                 │      │
                    ┌────────────┘      └─────────────┐
                    ▼                                 ▼
             ┌──────────────┐                  ┌──────────────┐
             │  PostgreSQL  │                  │    Redis     │
             │              │                  │              │
             │ Users        │                  │ BullMQ       │
             │ Emails       │                  │ Rate limits  │
             └──────────────┘                  └──────┬───────┘
                                                       │
                                                       ▼
                                             ┌──────────────────┐
                                             │   Email Worker   │
                                             │ BullMQ Worker    │
                                             └────────┬─────────┘
                                                      │
                         ┌────────────────────────────┼─────────────────────┐
                         ▼                            ▼                     ▼
                  ┌─────────────┐             ┌──────────────┐      ┌────────────┐
                  │  Ethereal   │             │ Elasticsearch│      │   Slack    │
                  │    SMTP     │             │              │      │  Webhook   │
                  └─────────────┘             └──────────────┘      └────────────┘