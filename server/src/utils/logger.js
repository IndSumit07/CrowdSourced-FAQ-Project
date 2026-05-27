import pino from "pino";
import { env } from "../configs/env.config.js";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    },
  }),
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: {
    pid: process.pid,
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
