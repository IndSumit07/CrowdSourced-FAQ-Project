import { queueConfig } from "../../configs/queue.config.js";
import { logger } from "../../utils/logger.js";
import { randomUUID } from "crypto";

const createDisabledQueue = (queueName) => ({
  async add(jobName, data, options = {}) {
    const jobId = options.jobId || `${queueName}:${jobName}:${randomUUID()}`;
    logger.warn({
      msg: "Queue job skipped because Redis is disconnected",
      queue: queueName,
      jobName,
      jobId,
    });
    return { id: jobId, name: jobName, data, opts: options };
  },

  async remove(jobId) {
    logger.warn({
      msg: "Queue job removal skipped because Redis is disconnected",
      queue: queueName,
      jobId,
    });
    return true;
  },

  async close() {
    return undefined;
  },

  on() {
    return this;
  },
});

// ─── Disabled queues while Redis is disconnected ───────────────────────────────

export const deadlineQueue = createDisabledQueue(
  queueConfig.queues.deadlineProcessor,
);

export const aiSummarizationQueue = createDisabledQueue(
  queueConfig.queues.aiSummarization,
);

export const faqGenerationQueue = createDisabledQueue(
  queueConfig.queues.faqGeneration,
);

export const notificationQueue = createDisabledQueue(
  queueConfig.queues.notifications,
);

logger.info({
  msg: "BullMQ queues disabled while Redis is disconnected",
  queues: Object.values(queueConfig.queues),
});
