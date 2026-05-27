import { Server } from "socket.io";
import { env } from "./env.config.js";
import { logger } from "../utils/logger.js";

let io = null;

export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ msg: "Socket connected", socketId: socket.id, ip: socket.handshake.address });

    // Auto-join role-based rooms from auth token
    const { role, userId } = socket.handshake.auth;
    if (role) socket.join(`role:${role}`);
    if (userId) socket.join(`user:${userId}`);

    socket.on("join:contributor-feed", () => {
      socket.join("feed:contributors");
      logger.debug({ msg: "Socket joined contributor feed", socketId: socket.id });
    });

    socket.on("join:admin", () => {
      socket.join("room:admin");
      logger.debug({ msg: "Socket joined admin room", socketId: socket.id });
    });

    socket.on("disconnect", (reason) => {
      logger.info({ msg: "Socket disconnected", socketId: socket.id, reason });
    });
  });

  logger.info({ msg: "Socket.io initialized" });
  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized. Call initSocketIO first.");
  return io;
};
