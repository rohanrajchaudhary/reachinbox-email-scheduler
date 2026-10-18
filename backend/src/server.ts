import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import passport from "./config/auth";

import { Queue } from "bullmq";

import { ExpressAdapter } from "@bull-board/express";
import {
  createBullBoard,
} from "@bull-board/api";
import {
  BullMQAdapter,
} from "@bull-board/api/bullMQAdapter";

/*
|--------------------------------------------------------------------------
| Start BullMQ Worker
|--------------------------------------------------------------------------
|
| email.worker.ts creates and starts the BullMQ Worker.
| Importing it here makes the worker run inside the same
| Render Web Service process as Express.
|
*/

import "./workers/email.worker";

const PORT =
  Number(process.env.PORT) || 5000;

app.use(passport.initialize());

/*
|--------------------------------------------------------------------------
| Email Queue
|--------------------------------------------------------------------------
*/

const emailQueue = new Queue(
  "email-scheduler",
  {
    connection: {
      host:
        process.env.REDIS_HOST ||
        "localhost",

      port:
        Number(process.env.REDIS_PORT) ||
        6379,
    },
  }
);

/*
|--------------------------------------------------------------------------
| Bull Board
|--------------------------------------------------------------------------
*/

const serverAdapter =
  new ExpressAdapter();

serverAdapter.setBasePath(
  "/admin/queues"
);

createBullBoard({
  queues: [
    new BullMQAdapter(
      emailQueue
    ),
  ],

  serverAdapter,
});

app.use(
  "/admin/queues",
  serverAdapter.getRouter()
);

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(
    `🚀 ReachInbox backend running on port ${PORT}`
  );

  console.log(
    `📊 BullMQ dashboard: http://localhost:${PORT}/admin/queues`
  );

  console.log(
    `👷 Email worker is running inside the backend process`
  );
});