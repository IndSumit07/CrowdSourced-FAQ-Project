/**
 * Centralized Socket.io event name constants.
 * Used by both server emitters and client listeners to prevent typos.
 */
export const SOCKET_EVENTS = Object.freeze({
  // Query feed events
  NEW_QUERY: "query:new",
  QUERY_UPDATED: "query:updated",
  QUERY_EXPIRED: "query:expired",
  QUERY_COMPLETED: "query:completed",
  QUERY_ANSWERED: "query:answered",
  QUERY_FLAGGED: "query:flagged",
  QUERY_REMOVED: "query:removed",

  // Contributor events
  CONTRIBUTOR_ACCEPTED: "contributor:accepted",
  NEW_ANSWER: "contributor:answer",
  CONTRIBUTOR_ANSWER_ACCEPTED: "contributor:answer-accepted",

  // FAQ events
  FAQ_PUBLISHED: "faq:published",
  FAQ_PENDING_REVIEW: "faq:pending-review",

  // Admin events
  ADMIN_NOTIFICATION: "admin:notification",
  DEADLINE_APPROACHING: "deadline:approaching",

  // User notifications
  USER_NOTIFICATION: "notification:user",

  // Connection lifecycle
  CONNECTED: "connection",
  DISCONNECTED: "disconnect",
});
