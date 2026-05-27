export const queueConfig = Object.freeze({
  queues: {
    deadlineProcessor: "deadline-processor",
    aiSummarization: "ai-summarization",
    faqGeneration: "faq-generation",
    notifications: "notifications",
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 100, age: 3600 },
    removeOnFail: { count: 500, age: 86400 },
  },
  workerOptions: {
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
});
