import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

const server = http.createServer(app);

// Initialize Socket.IO server
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
    // Safeguard to check if listener was sent what is needed before attempting connection
    if (!userData?.username || !userData?.user_id || !roomName) {
      console.log("User attempted to join room with invalid userData or roomName");
      return;
    }

    // Add user to room
    socket.join(roomName);

    // Store some user information in socket instance
    socket.userData = userData;
    socket.roomName = roomName;

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
    // Safeguard to check if userData is properly populated, if no userData exists, skip cleanup and return.
    if (!socket.userData) {
      console.log("User attempted to leave room with invalid userData");
      return;
    }

    console.log(`${socket.userData.username} disconnected from room: ${socket.roomName}`);

    // Loop through all rooms this socket is part of
    for (const roomName of socket.rooms) {
      if (roomName === socket.id) continue;

      const roomUsers = activeUsers.get(roomName);
      if (!roomUsers) continue;

      // Remove user from active user list
      roomUsers.delete(socket.userData.user_id);

      io.to(roomName).emit("activeUsersUpdated", [...roomUsers.values()]);

      // Clean up empty rooms from the map
      if (roomUsers.size === 0) {
        activeUsers.delete(roomName);
      }
    }
  });
});

export { io, server };