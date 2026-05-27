import { Queue, Worker } from "bullmq";
import { bullMQRedisConnection } from "../../configs/redis.config.js";
import { queueConfig } from "../../configs/queue.config.js";
import { logger } from "../../utils/logger.js";

// ─── Deadline Queue ────────────────────────────────────────────────────────────

export const deadlineQueue = new Queue(queueConfig.queues.deadlineProcessor, {
  connection: bullMQRedisConnection,
  defaultJobOptions: queueConfig.defaultJobOptions,
});

// ─── AI Summarization Queue ────────────────────────────────────────────────────

export const aiSummarizationQueue = new Queue(queueConfig.queues.aiSummarization, {
  connection: bullMQRedisConnection,
  defaultJobOptions: queueConfig.defaultJobOptions,
});

// ─── FAQ Generation Queue ──────────────────────────────────────────────────────

export const faqGenerationQueue = new Queue(queueConfig.queues.faqGeneration, {
  connection: bullMQRedisConnection,
  defaultJobOptions: queueConfig.defaultJobOptions,
});

// ─── Notification Queue ────────────────────────────────────────────────────────

export const notificationQueue = new Queue(queueConfig.queues.notifications, {
  connection: bullMQRedisConnection,
  defaultJobOptions: { ...queueConfig.defaultJobOptions, attempts: 5 },
});

logger.info({ msg: "BullMQ queues initialized", queues: Object.values(queueConfig.queues) });
