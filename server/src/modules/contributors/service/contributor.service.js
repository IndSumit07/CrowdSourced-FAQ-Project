import { QueryRepository, ContributorResponseRepository } from "../../queries/repository/query.repository.js";
import { UserRepository } from "../../users/repository/user.repository.js";
import { Notification } from "../../notifications/schema/notification.schema.js";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../../utils/errors.js";
import { getIO } from "../../../configs/socket.config.js";
import { SOCKET_EVENTS } from "../../realtime/constants/events.js";
import { logger } from "../../../utils/logger.js";
import { env } from "../../../configs/env.config.js";

const queryRepo = new QueryRepository();
const responseRepo = new ContributorResponseRepository();
const userRepo = new UserRepository();

const FLAG_THRESHOLD = 5;

export class ContributorService {
  async acceptQuery(queryId, contributorId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");

    if (!["open", "in-progress"].includes(query.status)) {
      throw new BadRequestError(`Query is not available for contribution (status: ${query.status})`);
    }

    if (query.creator.toString() === contributorId) {
      throw new ForbiddenError("Cannot accept your own query");
    }

    const existing = await responseRepo.findByQueryAndContributor(queryId, contributorId);
    if (existing) throw new BadRequestError("You have already responded to this query");

    // Create acceptance record
    const response = await responseRepo.create({
      query: queryId,
      contributor: contributorId,
      accepted: true,
      skipped: false,
    });

    await queryRepo.addAcceptedContributor(queryId, contributorId);

    // Notify the query creator + broadcast updated contributor count to the feed
    try {
      const io = getIO();
      io.to(`user:${query.creator._id || query.creator}`).emit(
        SOCKET_EVENTS.CONTRIBUTOR_ACCEPTED,
        { queryId, contributorId, responseId: response._id }
      );

      // Let everyone on the feed see the updated contributor count in real-time
      io.to("feed:contributors").emit(SOCKET_EVENTS.QUERY_UPDATED, {
        queryId,
        status: "in-progress",
        acceptedContributorsCount: (query.acceptedContributors?.length || 0) + 1,
      });
    } catch (e) {
      logger.warn({ msg: "Could not emit contributor accepted event", err: e.message });
    }


    return response;
  }

  async submitAnswer(queryId, contributorId, { answer, confidence }) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");

    if (["completed", "rejected", "expired"].includes(query.status)) {
      throw new BadRequestError("This query is no longer accepting answers");
    }

    const existing = await responseRepo.findByQueryAndContributor(queryId, contributorId);
    if (!existing) throw new BadRequestError("You must accept the query before submitting an answer");
    if (existing.answer) throw new BadRequestError("You have already submitted an answer");

    const updated = await responseRepo.updateById(existing._id, { answer, confidence });
    await queryRepo.incrementResponseCount(queryId);
    await userRepo.incrementReputation(contributorId, 5);

    // Notify admin room about new answer
    try {
      const io = getIO();
      const newResponseCount = query.responseCount + 1;

      io.to("room:admin").emit(SOCKET_EVENTS.NEW_ANSWER, {
        queryId,
        contributorId,
        responseCount: newResponseCount,
      });

      // Broadcast updated response count to the contributor feed so
      // everyone's card reflects the latest tally without a page refresh.
      io.to("feed:contributors").emit(SOCKET_EVENTS.QUERY_UPDATED, {
        queryId,
        responseCount: newResponseCount,
        status: "in-progress",
      });
    } catch (e) {
      logger.warn({ msg: "Could not emit new answer event", err: e.message });
    }

    logger.info({ msg: "Answer submitted", queryId, contributorId });
    return updated;
  }

  async skipQuery(queryId, contributorId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");

    const existing = await responseRepo.findByQueryAndContributor(queryId, contributorId);
    if (existing) {
      await responseRepo.updateById(existing._id, { skipped: true });
    } else {
      await responseRepo.create({ query: queryId, contributor: contributorId, skipped: true });
    }

    return { skipped: true };
  }

  async flagQuery(queryId, contributorId) {
    const query = await queryRepo.findById(queryId);
    if (!query) throw new NotFoundError("Query");

    if (["completed", "rejected", "expired", "processing"].includes(query.status)) {
      throw new BadRequestError("This query can no longer be flagged");
    }

    if (query.creator.toString() === contributorId) {
      throw new ForbiddenError("Cannot flag your own query");
    }

    const alreadyFlagged = (query.flaggedBy || []).some(
      (id) => id.toString() === contributorId
    );
    if (alreadyFlagged) {
      throw new BadRequestError("You have already flagged this query");
    }

    const updated = await queryRepo.updateById(queryId, {
      $addToSet: { flaggedBy: contributorId },
      $inc: { flagCount: 1 },
    });

    const newFlagCount = (updated.flagCount || 0) + 1;
    const io = getIO();
    io.to("feed:contributors").emit(SOCKET_EVENTS.QUERY_FLAGGED, {
      queryId,
      flagCount: newFlagCount,
    });

    if (newFlagCount >= FLAG_THRESHOLD) {
      await queryRepo.updateStatus(queryId, "rejected");

      await Notification.create({
        recipient: query.creator,
        type: "query_flagged",
        message: "Your query was flagged by users as irrelevant and has been removed.",
        metadata: { queryId },
      });

      io.to(`user:${query.creator}`).emit(SOCKET_EVENTS.USER_NOTIFICATION, {
        type: "query_flagged",
        message: "Your query was flagged by users as irrelevant and has been removed.",
        queryId,
      });

      io.to("feed:contributors").emit(SOCKET_EVENTS.QUERY_REMOVED, { queryId });

      logger.info({ msg: "Query removed due to flag threshold", queryId, flagCount: newFlagCount });
    }

    return { flagged: true, flagCount: newFlagCount };
  }

  async getMyResponses(contributorId, params) {
    return responseRepo.findByContributor(contributorId, {
      skip: (parseInt(params.page || 1) - 1) * parseInt(params.limit || 20),
      limit: parseInt(params.limit || 20),
    });
  }
}
