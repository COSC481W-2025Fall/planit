import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://app.planit-travel.me",
      "https://www.planit-travel.me",
      "https://planit-travel.me",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store active users per room
const activeUsers = new Map();

io.on("connection", (socket) => {
  socket.on("joinTrip", (roomName, userData) => {
    socket.join(roomName);
    socket.userData = userData;

    console.log(`${userData?.username} connected to room: ${roomName}`);

    if (!activeUsers.has(roomName)) {
      activeUsers.set(roomName, new Map());
    }

    activeUsers.get(roomName).set(userData.user_id, {
      socketId: socket.id,
      username: userData.username,
      user_id: userData.user_id,
    });

    io.to(roomName).emit("activeUsersUpdated", [...activeUsers.get(roomName).values()]);
  });

  socket.on("disconnecting", () => {
    console.log("Disconnecting:", socket.id);

    for (const roomName of socket.rooms) {
      if (roomName === socket.id) continue;

      const roomUsers = activeUsers.get(roomName);
      if (!roomUsers) continue;

      roomUsers.delete(socket.userData.user_id);

      io.to(roomName).emit("activeUsersUpdated", [...roomUsers.values()]);

      if (roomUsers.size === 0) {
        activeUsers.delete(roomName);
      }
    }
  });
});

export { io, server };