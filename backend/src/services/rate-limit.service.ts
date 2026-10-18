import { createClient } from "redis";
import env from "../config/env";

const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

redis.on("error", (err) => {
  console.error("Rate Limit Redis Error:", err);
});

let connectPromise: ReturnType<typeof redis.connect> | null = null;

async function getRedis() {
  if (!redis.isOpen) {
    if (!connectPromise) {
      connectPromise = redis.connect().finally(() => {
        connectPromise = null;
      });
    }

    await connectPromise;
  }

  return redis;
}

export function getCurrentHourKey(sender: string): string {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");

  return `email-rate:${sender}:${year}-${month}-${day}-${hour}`;
}

/**
 * Atomically checks and consumes one email from the
 * sender's hourly rate limit.
 *
 * Returns:
 * true  -> email is allowed
 * false -> hourly limit has been reached
 */
export async function tryConsumeRateLimit(
  sender: string,
  hourlyLimit: number
): Promise<boolean> {
  const client = await getRedis();

  const key = getCurrentHourKey(sender);
  const limit = Math.max(1, Number(hourlyLimit) || 100);

  const script = `
    local current = tonumber(redis.call("GET", KEYS[1]) or "0")
    local limit = tonumber(ARGV[1])

    if current >= limit then
      return 0
    end

    local newCount = redis.call("INCR", KEYS[1])

    if newCount == 1 then
      redis.call("EXPIRE", KEYS[1], 7200)
    end

    return 1
  `;

  const result = await client.eval(script, {
    keys: [key],
    arguments: [String(limit)],
  });

  return Number(result) === 1;
}

export function getNextHourTimestamp(): number {
  const nextHour = new Date();

  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);

  return nextHour.getTime();
}