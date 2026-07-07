import { createServer } from "node:http";

import { Server } from "socket.io";
import { logger } from "./logger.js";

let httpServer = null;
let io = null;

function getSocketPort() {
  return Number(process.env.SOCKET_PORT || 3001);
}

export function startSocketServer() {
  if (io) {
    return io;
  }

  httpServer = createServer();
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
      credentials: false,
    },
  });

  io.on("connection", (socket) => {
    logger.info("User connected", { service: "socket-server", userId: socket.id });

    socket.on("review:join", ({ userId }) => {
      if (!userId) {
        return;
      }

      socket.join(String(userId));
      logger.info("User joined review room", { service: "socket-server", userId });
    });

    socket.on("disconnect", () => {
      logger.info("User disconnected", { service: "socket-server", userId: socket.id });
    });
  });

  httpServer.listen(getSocketPort(), () => {
    logger.info(`Review socket server listening on ${getSocketPort()}`, { service: "socket-server" });
  });

  return io;
}

export function emitReviewEvent(userId, eventName, payload = {}) {
  if (!io || !userId) {
    return;
  }

  io.to(String(userId)).emit(eventName, payload);
}