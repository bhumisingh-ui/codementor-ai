import { createServer } from "node:http";

import { Server } from "socket.io";

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
    socket.on("review:join", ({ userId }) => {
      if (!userId) {
        return;
      }

      socket.join(String(userId));
    });
  });

  httpServer.listen(getSocketPort(), () => {
    console.log(`Review socket server listening on ${getSocketPort()}`);
  });

  return io;
}

export function emitReviewEvent(userId, eventName, payload = {}) {
  if (!io || !userId) {
    return;
  }

  io.to(String(userId)).emit(eventName, payload);
}