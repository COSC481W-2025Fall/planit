import http from "http";
import {Server} from "socket.io";
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

io.on("connection", (socket) => {
  socket.on("joinTrip", (roomName) => {
    socket.join(roomName);
    console.log("Participant connected to room:", roomName);
  });

  socket.on("disconnect", () => {
    console.log("Participant disconnected from room:", socket.roomName);
  });
});

export { io, server };