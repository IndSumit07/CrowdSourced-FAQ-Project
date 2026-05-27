import { Worker } from "bullmq";
import { bullMQRedisConnection } from "../../configs/redis.config.js";
import { queueConfig } from "../../configs/queue.config.js";
import {
  QueryRepository,
  ContributorResponseRepository,
} from "../queries/repository/query.repository.js";
import { FAQRepository } from "../faq/repository/faq.repository.js";
import { EmbeddingService } from "../ai/service/embedding.service.js";
import { AIValidationService } from "../ai/service/aiValidation.service.js";
import {
  aiSummarizationQueue,
  faqGenerationQueue,
  notificationQueue,
} from "./deadline.queue.js";
import { getIO } from "../../configs/socket.config.js";
import { SOCKET_EVENTS } from "../realtime/constants/events.js";
import { logger } from "../../utils/logger.js";
import { env } from "../../configs/env.config.js";

const queryRepo = new QueryRepository();
const responseRepo = new ContributorResponseRepository();
const faqRepo = new FAQRepository();
const embeddingService = new EmbeddingService();
const aiValidationService = new AIValidationService();

// ─── Deadline Worker ───────────────────────────────────────────────────────────

export const deadlineWorker = new Worker(
  queueConfig.queues.deadlineProcessor,
  async (job) => {
    const { queryId } = job.data;
    logger.info({ msg: "Processing deadline", queryId });

    const query = await queryRepo.findById(queryId);
    if (!query) {
      logger.warn({ msg: "Query not found for deadline processing", queryId });
      return;
    }

    if (["completed", "rejected"].includes(query.status)) {
      logger.info({
        msg: "Query already processed, skipping",
        queryId,
        status: query.status,
      });
      return;
    }

    const responses = await responseRepo.findByQuery(queryId);

    if (responses.length < env.MIN_CONTRIBUTOR_RESPONSES) {
      await queryRepo.updateStatus(queryId, "expired");

      try {
        const io = getIO();
        io.emit(SOCKET_EVENTS.QUERY_EXPIRED, {
          queryId,
          question: query.question,
        });
        io.to(`user:${query.creator}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
          type: "query_expired",
          message:
            "Your query expired without enough responses. Please try again.",
          queryId,
        });
      } catch (e) {
        logger.warn({ msg: "Could not emit expiry event", err: e.message });
      }

      return;
    }

    // Enough responses — trigger summarization
    await queryRepo.updateStatus(queryId, "processing");
    await aiSummarizationQueue.add(
      "summarize",
      { queryId },
      { jobId: `summarize_${queryId}` },
    );

    logger.info({
      msg: "Deadline processed, queued for summarization",
      queryId,
      responseCount: responses.length,
    });
  },
  {
    connection: bullMQRedisConnection,
    ...queueConfig.workerOptions,
  },
);

// ─── AI Summarization Worker ───────────────────────────────────────────────────

export const aiSummarizationWorker = new Worker(
  queueConfig.queues.aiSummarization,
  async (job) => {
    const { queryId } = job.data;
    logger.info({ msg: "Starting AI summarization", queryId });

    const query = await queryRepo.findById(queryId);
    if (!query) return;

    const responses = await responseRepo.findByQuery(queryId);
    const answers = responses.map((r) => r.answer).filter(Boolean);

    if (answers.length === 0) {
      await queryRepo.updateStatus(queryId, "expired");
      return;
    }

    // AI summarization
    const synthesizedAnswer = await aiValidationService.summarizeAnswers(
      query.question,
      answers,
    );

    // Queue FAQ generation
    await faqGenerationQueue.add(
      "generate-faq",
      { queryId, question: query.question, synthesizedAnswer },
      { jobId: `faq_gen_${queryId}` },
    );
  },
  { connection: bullMQRedisConnection, concurrency: 3 },
);

// ─── FAQ Generation Worker ─────────────────────────────────────────────────────

export const faqGenerationWorker = new Worker(
  queueConfig.queues.faqGeneration,
  async (job) => {
    const { queryId, question, synthesizedAnswer } = job.data;
    logger.info({ msg: "Generating FAQ draft", queryId });

    const query = await queryRepo.findById(queryId);
    if (!query) return;

    const draft = await aiValidationService.draftFAQ(
      question,
      synthesizedAnswer,
    );
    const embedding = await embeddingService.embed(draft.title);

    // Find a system admin user as placeholder creator — ideally you'd set a service account
    const faq = await faqRepo.create({
      title: draft.title,
      answer: draft.answer,
      category: draft.category || query.category,
      tags: draft.tags || [],
      embedding,
      published: false,
      aiGenerated: true,
      sourceQuery: queryId,
      createdBy: query.creator,
    });

    await queryRepo.updateById(queryId, {
      status: "completed",
      faqGenerated: faq._id,
    });

    // Notify admin
    try {
      const io = getIO();
      io.to("room:admin").emit(SOCKET_EVENTS.FAQ_PENDING_REVIEW, {
        faqId: faq._id,
        title: faq.title,
        category: faq.category,
        queryId,
      });
      io.to("room:admin").emit(SOCKET_EVENTS.ADMIN_NOTIFICATION, {
        message: `New FAQ draft ready for review: "${faq.title}"`,
        type: "faq_draft",
        faqId: faq._id,
      });
    } catch (e) {
      logger.warn({ msg: "Could not emit FAQ ready event", err: e.message });
    }

    // Notify query creator
    await notificationQueue.add("notify-creator", {
      userId: query.creator.toString(),
      type: "query_completed",
      message:
        "Your query has been processed and an FAQ draft is under review.",
      queryId: queryId.toString(),
      faqId: faq._id.toString(),
    });

    logger.info({ msg: "FAQ draft created", faqId: faq._id, queryId });
  },
  { connection: bullMQRedisConnection, concurrency: 3 },
);

// ─── Notification Worker ───────────────────────────────────────────────────────

export const notificationWorker = new Worker(
  queueConfig.queues.notifications,
  async (job) => {
    const { userId, type, message, queryId, faqId } = job.data;

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
        type,
        message,
        queryId,
        faqId,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      logger.warn({ msg: "Notification delivery failed", err: e.message });
      throw e; // Re-throw to trigger retry
    }
  },
  { connection: bullMQRedisConnection, concurrency: 10 },
);

// ─── Worker Error Handlers ─────────────────────────────────────────────────────

[
  deadlineWorker,
  aiSummarizationWorker,
  faqGenerationWorker,
  notificationWorker,
].forEach((worker) => {
  worker.on("failed", (job, err) => {
    logger.error({
      msg: "BullMQ job failed",
      jobId: job?.id,
      err: err.message,
    });
  });
  worker.on("completed", (job) => {
    logger.debug({ msg: "BullMQ job completed", jobId: job.id });
  });
});

logger.info({ msg: "BullMQ workers started" });
