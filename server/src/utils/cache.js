import { redisClient } from "../configs/redis.config.js";
import { logger } from "./logger.js";

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get a value from Redis cache.
 * Returns parsed JSON or null if not found.
 */
export const cacheGet = async (key) => {
  try {
    const val = await redisClient.get(key);
    if (val === null) return null;
    return JSON.parse(val);
  } catch (err) {
    logger.warn({ msg: "Cache GET failed", key, err: err.message });
    return null;
  }
};

/**
 * Set a JSON value in Redis with optional TTL (seconds).
 */
export const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.warn({ msg: "Cache SET failed", key, err: err.message });
  }
};

/**
 * Delete one or more keys from Redis.
 */
export const cacheDel = async (...keys) => {
  try {
    if (keys.length > 0) await redisClient.del(...keys);
  } catch (err) {
    logger.warn({ msg: "Cache DEL failed", keys, err: err.message });
  }
};

/**
 * Delete all keys matching a pattern.
 */
export const cacheDelPattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch (err) {
    logger.warn({ msg: "Cache DEL pattern failed", pattern, err: err.message });
  }
};

/**
 * Cache-aside wrapper: checks cache first, calls loader on miss, stores result.
 */
export const withCache = async (key, loader, ttl = DEFAULT_TTL) => {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const fresh = await loader();
  if (fresh !== null && fresh !== undefined) {
    await cacheSet(key, fresh, ttl);
  }
  return fresh;
};
