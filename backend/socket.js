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
// roomName -> Set of {socketId, username, user_id}
const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  socket.on("joinTrip", (roomName, userData) => {
    socket.join(roomName);
    socket.currentRoom = roomName;
    socket.userData = userData;
    
    console.log(`${userData?.username} connected to room: ${roomName}`);
    
    if (!activeUsers.has(roomName)) {
      activeUsers.set(roomName, new Set());
    }
    
    const roomUsers = activeUsers.get(roomName);
    
    // Remove any existing entries for this user (prevent duplicates on reconnect)
    const existingUsers = Array.from(roomUsers);
    const withoutCurrentUser = existingUsers.filter(u => u.user_id !== userData.user_id);
    
    // Add current user
    const updatedUsers = [
      ...withoutCurrentUser,
      {
        socketId: socket.id,
        username: userData.username,
        user_id: userData.user_id
      }
    ];
    
    activeUsers.set(roomName, new Set(updatedUsers));
    
    // Notify everyone in the room
    io.to(roomName).emit("activeUsersUpdated", updatedUsers);
    
    console.log(`Active users in ${roomName}:`, updatedUsers.map(u => u.username));
  });

  socket.on("disconnecting", () => {
    if (socket.currentRoom) {
      handleUserLeave(socket, socket.currentRoom);
    }
  });

  // socket.on("disconnect", (reason) => {
  //   console.log(`Socket ${socket.id} fully disconnected. Reason: ${reason}`);
  // });

  function handleUserLeave(socket, roomName) {
    console.log(`${socket.userData?.username || 'Unknown'} (${socket.id}) leaving room: ${roomName}`);
    
    if (activeUsers.has(roomName)) {
      const roomUsers = activeUsers.get(roomName);
      const userArray = Array.from(roomUsers);
      
      console.log(`Before removal:`, userArray.map(u => `${u.username}(${u.socketId})`));
      
      //remove user by socket ID
      const filtered = userArray.filter(u => u.socketId !== socket.id);
      
      console.log(`After removal:`, filtered.map(u => `${u.username}(${u.socketId})`));
      
      if (filtered.length === 0) {
        //no users left, delete the room
        activeUsers.delete(roomName);
        console.log(`Room ${roomName} deleted (empty)`);
      } else {
        //update with remaining users
        activeUsers.set(roomName, new Set(filtered));
      }
      
      io.to(roomName).emit("activeUsersUpdated", filtered);
      console.log(`Emitted activeUsersUpdated to ${roomName}:`, filtered.map(u => u.username));
    } else {
      console.log(`Room ${roomName} not found in activeUsers`);
    }
    
    socket.leave(roomName);
    socket.currentRoom = null;
  }
});

export { io, server };