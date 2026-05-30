import {
  QueryRepository,
  ContributorResponseRepository,
} from "../repository/query.repository.js";
import {
  AIValidationService,
  sanitizeAiGeneratedText,
} from "../../ai/service/aiValidation.service.js";
import { getIO } from "../../../configs/socket.config.js";
import { SOCKET_EVENTS } from "../../realtime/constants/events.js";
import { logger } from "../../../utils/logger.js";

const queryRepo = new QueryRepository();
const responseRepo = new ContributorResponseRepository();
const aiValidationService = new AIValidationService();

export class QueryExpiryService {
  #running = false;

  async sweepExpiredQueries() {
    if (this.#running) {
      return { processed: 0, total: 0, skipped: true };
    }

    this.#running = true;

    try {
      const expiredQueries = await queryRepo.findExpiredQueries();
      let processed = 0;

      for (const query of expiredQueries) {
        const responses = await responseRepo.findByQuery(query._id);
        const answers = responses
          .map((response) => response.answer)
          .filter(Boolean);

        const aiSynthesizedAnswer =
          answers.length > 0
            ? sanitizeAiGeneratedText(
                await aiValidationService.summarizeAnswers(
                  query.question,
                  answers,
                ),
              )
            : "No contributor responses were submitted before the deadline.";

        await queryRepo.updateById(query._id, {
          status: "admin-review",
          aiSynthesizedAnswer,
          aiSummaryUsed: answers.length > 0,
          processingStartedAt: new Date(),
          deadlineJobId: null,
        });

        try {
          const io = getIO();
          const queryId = query._id.toString();
          const creatorId = (query.creator?._id || query.creator)?.toString();

          io.to("feed:contributors").emit(SOCKET_EVENTS.QUERY_EXPIRED, {
            queryId,
            question: query.question,
          });

          if (creatorId) {
            io.to(`user:${creatorId}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
              type: "query_expired",
              message: "Your query expired and is pending admin review.",
              queryId,
              aiSynthesizedAnswer,
            });
          }

          io.to("room:admin").emit(SOCKET_EVENTS.FAQ_PENDING_REVIEW, {
            queryId,
            title: query.question,
            aiSynthesizedAnswer,
            category: query.category,
            responseCount: answers.length,
          });

          io.to("room:admin").emit(SOCKET_EVENTS.ADMIN_NOTIFICATION, {
            type: "query_expired_review",
            message: `Expired query ready for review: "${query.question}"`,
            queryId,
            aiSynthesizedAnswer,
            responseCount: answers.length,
          });
        } catch (socketErr) {
          logger.warn({
            msg: "Could not emit expired query events",
            err: socketErr.message,
          });
        }

        processed += 1;
      }

      if (processed > 0) {
        logger.info({
          msg: "Expired queries promoted to admin review",
          processed,
          total: expiredQueries.length,
        });
      }

      return { processed, total: expiredQueries.length, skipped: false };
    } catch (err) {
      logger.warn({ msg: "Expired query sweep failed", err: err.message });
      return { processed: 0, total: 0, skipped: true };
    } finally {
      this.#running = false;
    }
  }
}
