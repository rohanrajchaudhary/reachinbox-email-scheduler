import dotenv from "dotenv";

dotenv.config();

import app from "./app";
import passport from "./config/auth";

import { Queue } from "bullmq";

import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

const PORT = Number(process.env.PORT) || 5000;

app.use(passport.initialize());

/*
 * BullMQ queue connection.
 */
const emailQueue = new Queue("email-scheduler", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port:
      Number(process.env.REDIS_PORT) || 6379,
  },
});

/*
 * Bull Board adapter.
 */
const serverAdapter =
  new ExpressAdapter();

serverAdapter.setBasePath(
  "/admin/queues"
);

/*
 * Create BullMQ dashboard.
 */
createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
  ],
  serverAdapter,
});

/*
 * Mount BullMQ dashboard.
 *
 * Open:
 * http://localhost:5000/admin/queues
 */
app.use(
  "/admin/queues",
  serverAdapter.getRouter()
);

app.listen(PORT, () => {
  console.log(
    `🚀 ReachInbox backend running on port ${PORT}`
  );

  console.log(
    `📊 BullMQ dashboard: http://localhost:${PORT}/admin/queues`
  );
});