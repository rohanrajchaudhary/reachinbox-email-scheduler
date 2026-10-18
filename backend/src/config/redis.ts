import { createClient } from "redis";
import env from "./env";

const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

export default redis;