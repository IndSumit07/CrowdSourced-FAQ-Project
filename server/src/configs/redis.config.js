import { randomUUID } from "crypto";

const cacheStore = new Map();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const globToRegExp = (pattern) => {
  const escaped = escapeRegExp(pattern).replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}$`);
};

const createDisabledClient = () => ({
  async get(key) {
    return cacheStore.has(key) ? cacheStore.get(key) : null;
  },

  async set(key, value) {
    cacheStore.set(key, value);
    return "OK";
  },

  async del(...keys) {
    const flatKeys = keys.flat();
    let removed = 0;
    for (const key of flatKeys) {
      if (cacheStore.delete(key)) removed += 1;
    }
    return removed;
  },

  async keys(pattern = "*") {
    const matcher = globToRegExp(pattern);
    return [...cacheStore.keys()].filter((key) => matcher.test(key));
  },

  async ping() {
    return "PONG";
  },

  async quit() {
    cacheStore.clear();
    return "OK";
  },

  on() {
    return this;
  },
});

const createDisabledQueueConnection = () => ({
  id: `redis-disabled-${randomUUID()}`,
  async quit() {
    return "OK";
  },
  async disconnect() {
    return "OK";
  },
  on() {
    return this;
  },
});

export const redisClient = createDisabledClient();
export const bullMQRedisConnection = createDisabledQueueConnection();
