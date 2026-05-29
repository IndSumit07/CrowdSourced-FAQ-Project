import { io } from "socket.io-client";

let socket = null;

/**
 * Initializes and returns the singleton Socket.io client.
 * Passes userId and role from auth state for room-based routing.
 */
export const initSocket = (userId, role) => {
  if (socket?.connected) return socket;

  // In production, connect directly to the backend URL.
  // In development, use '/' so the Vite proxy handles the upgrade.
  const serverUrl = import.meta.env.VITE_API_URL || "/";

  socket = io(serverUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: { userId, role },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.info("[Socket] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("[Socket] Connection error:", err.message);
  });

  return socket;
};

/**
 * Returns the existing socket instance (or null if not initialized).
 */
export const getSocket = () => socket;

/**
 * Joins the live contributor feed room.
 */
export const joinContributorFeed = () => {
  socket?.emit("join:contributor-feed");
};

/**
 * Joins the admin notification room.
 */
export const joinAdminRoom = () => {
  socket?.emit("join:admin");
};

/**
 * Disconnects and clears the socket singleton.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ─── Event name constants (mirrors server SOCKET_EVENTS) ──────────────────
export const SOCKET_EVENTS = {
  NEW_QUERY: "query:new",
  QUERY_UPDATED: "query:updated",
  QUERY_EXPIRED: "query:expired",
  QUERY_COMPLETED: "query:completed",
  QUERY_FLAGGED: "query:flagged",
  QUERY_REMOVED: "query:removed",
  CONTRIBUTOR_ACCEPTED: "contributor:accepted",
  NEW_ANSWER: "contributor:answer",
  CONTRIBUTOR_ANSWER_ACCEPTED: "contributor:answer-accepted",
  FAQ_PUBLISHED: "faq:published",
  FAQ_PENDING_REVIEW: "faq:pending-review",
  ADMIN_NOTIFICATION: "admin:notification",
  DEADLINE_APPROACHING: "deadline:approaching",
  USER_NOTIFICATION: "notification:user",
};
