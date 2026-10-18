import { Queue } from "bullmq";
import env from "../config/env";

const emailQueue = new Queue("email-scheduler", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

export default emailQueue;