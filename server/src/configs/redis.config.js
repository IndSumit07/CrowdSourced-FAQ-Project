import { Redis } from "ioredis";
import { env } from "./env.config.js";
import { logger } from "../utils/logger.js";

/**
 * Builds an ioredis client configured for Upstash Redis over TLS.
 *
 * Upstash requires:
 *   - tls: {} to enable SSL/TLS (rediss:// protocol)
 *   - maxRetriesPerRequest: null for BullMQ compatibility
 *
 * Connection priority:
 *   1. UPSTASH_REDIS_URL  (full rediss:// URL — takes precedence)
 *   2. UPSTASH_REDIS_HOST + UPSTASH_REDIS_PORT + UPSTASH_REDIS_PASSWORD
 */
const buildRedisConfig = (lazyConnect = false) => {
  const baseOptions = {
    lazyConnect,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    tls: {}, // Upstash REQUIRES TLS (rediss://)
    retryStrategy: (times) => {
      const delay = Math.min(times * 200, 5000);
      logger.warn({ msg: "Upstash Redis retry", attempt: times, delayMs: delay });
      return delay;
    },
  };

  // If full URL is provided, use it directly
  if (env.UPSTASH_REDIS_URL) {
    return { ...baseOptions, url: env.UPSTASH_REDIS_URL };
  }

  // Otherwise use individual credentials
  if (!env.UPSTASH_REDIS_HOST || !env.UPSTASH_REDIS_PASSWORD) {
    throw new Error(
      "Upstash Redis config missing. Set UPSTASH_REDIS_URL or both UPSTASH_REDIS_HOST and UPSTASH_REDIS_PASSWORD in .env"
    );
  }

  return {
    ...baseOptions,
    host: env.UPSTASH_REDIS_HOST,
    port: env.UPSTASH_REDIS_PORT,
    password: env.UPSTASH_REDIS_PASSWORD,
    username: "default", // Upstash always uses "default" as the username
  };
};

const attachEventListeners = (client, name) => {
  client.on("connect", () => logger.info({ msg: `[${name}] Upstash Redis connected` }));
  client.on("ready", () => logger.info({ msg: `[${name}] Upstash Redis ready` }));
  client.on("error", (err) => logger.error({ msg: `[${name}] Upstash Redis error`, err: err.message }));
  client.on("close", () => logger.warn({ msg: `[${name}] Upstash Redis connection closed` }));
  client.on("reconnecting", () => logger.info({ msg: `[${name}] Upstash Redis reconnecting` }));
};

// ─── Primary client for caching ────────────────────────────────────────────────
export const redisClient = (() => {
  const config = buildRedisConfig(false);
  const client = env.UPSTASH_REDIS_URL
    ? new Redis(config.url, { tls: {}, maxRetriesPerRequest: null, enableReadyCheck: false, retryStrategy: config.retryStrategy })
    : new Redis(config);
  attachEventListeners(client, "cache");
  return client;
})();

// ─── Dedicated connection for BullMQ ──────────────────────────────────────────
// BullMQ requires a separate connection with maxRetriesPerRequest: null
export const bullMQRedisConnection = (() => {
  const config = buildRedisConfig(true); // lazyConnect = true for BullMQ
  const client = env.UPSTASH_REDIS_URL
    ? new Redis(config.url, { tls: {}, maxRetriesPerRequest: null, enableReadyCheck: false, lazyConnect: true, retryStrategy: config.retryStrategy })
    : new Redis(config);
  attachEventListeners(client, "bullmq");
  return client;
})();
