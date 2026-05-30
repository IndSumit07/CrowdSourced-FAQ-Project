import { queueConfig } from "../../configs/queue.config.js";
import { logger } from "../../utils/logger.js";

logger.info({
  msg: "BullMQ workers disabled while Redis is disconnected",
  queues: Object.values(queueConfig.queues),
});

export const deadlineWorker = null;
export const aiSummarizationWorker = null;
export const faqGenerationWorker = null;
export const notificationWorker = null;
