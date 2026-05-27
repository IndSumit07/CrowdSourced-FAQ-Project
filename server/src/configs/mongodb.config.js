import mongoose from "mongoose";
import { env } from "./env.config.js";
import { logger } from "../utils/logger.js";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  mongoose.set("autoIndex", env.NODE_ENV !== "production");
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    isConnected = true;
    logger.info({ msg: "MongoDB connected", host: mongoose.connection.host });
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ msg: "MongoDB connection error", err });
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    logger.warn({ msg: "MongoDB disconnected" });
  });

  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  });
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  logger.info({ msg: "MongoDB disconnected gracefully" });
};

export { connectDB, disconnectDB };
