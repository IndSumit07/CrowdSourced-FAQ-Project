import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { env } from "./src/configs/env.config.js";
import { connectDB } from "./src/configs/mongodb.config.js";
import { redisClient, bullMQRedisConnection } from "./src/configs/redis.config.js";
import { initSocketIO } from "./src/configs/socket.config.js";
import { logger } from "./src/utils/logger.js";

// ─── Import workers to register them ──────────────────────────────────────────
import "./src/modules/queues/workers.js";

const httpServer = http.createServer(app);
const io = initSocketIO(httpServer);

// ─── Graceful shutdown handler ────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info({ msg: `Received ${signal}, shutting down gracefully...` });

  httpServer.close(async () => {
    try {
      await redisClient.quit();
      await bullMQRedisConnection.quit();
      const { disconnectDB } = await import("./src/configs/mongodb.config.js");
      await disconnectDB();
      logger.info({ msg: "Graceful shutdown complete" });
      process.exit(0);
    } catch (err) {
      logger.error({ msg: "Error during shutdown", err });
      process.exit(1);
    }
  });

  // Force exit after 10s
  setTimeout(() => {
    logger.warn({ msg: "Forcing shutdown after timeout" });
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.fatal({ msg: "Uncaught exception", err });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ msg: "Unhandled promise rejection", reason });
  process.exit(1);
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    await connectDB();

    // Validate Upstash Redis connection (non-fatal — Upstash reconnects automatically)
    try {
      await redisClient.ping();
      logger.info({ msg: "Upstash Redis ping OK" });
    } catch (redisErr) {
      logger.warn({ msg: "Upstash Redis ping failed — will retry automatically", err: redisErr.message });
    }

    logger.info({ msg: "All connections established" });

    httpServer.listen(env.PORT, () => {
      logger.info({
        msg: `🚀 Server running`,
        port: env.PORT,
        env: env.NODE_ENV,
        api: `http://localhost:${env.PORT}/api/v1`,
        health: `http://localhost:${env.PORT}/health`,
      });
    });
  } catch (err) {
    logger.fatal({ msg: "Failed to bootstrap server", err });
    process.exit(1);
  }
};

bootstrap();
