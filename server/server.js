import "dotenv/config";
import http from "http";
import app from "./src/app.js";
import { env } from "./src/configs/env.config.js";
import { connectDB } from "./src/configs/mongodb.config.js";
import { initSocketIO } from "./src/configs/socket.config.js";
import { logger } from "./src/utils/logger.js";
import { SectionService } from "./src/modules/faq/service/section.service.js";
import { QueryExpiryService } from "./src/modules/queries/service/query.expiry.service.js";

// ─── Import workers to register them ──────────────────────────────────────────
import "./src/modules/queues/workers.js";

const httpServer = http.createServer(app);
const io = initSocketIO(httpServer);
const queryExpiryService = new QueryExpiryService();
let queryExpirySweepTimer = null;

// ─── Graceful shutdown handler ────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info({ msg: `Received ${signal}, shutting down gracefully...` });

  if (queryExpirySweepTimer) {
    clearInterval(queryExpirySweepTimer);
    queryExpirySweepTimer = null;
  }

  httpServer.close(async () => {
    try {
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

    // Seed sections from faqs.json
    const sectionService = new SectionService();
    await sectionService.seedFromJson();

    await queryExpiryService.sweepExpiredQueries();
    queryExpirySweepTimer = setInterval(() => {
      queryExpiryService.sweepExpiredQueries().catch((err) => {
        logger.warn({
          msg: "Periodic expired query sweep failed",
          err: err.message,
        });
      });
    }, 60_000);

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
