import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { neon } from "@neondatabase/serverless";
import "./auth.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import placesAPIRoutes from "./routes/placesAPIRoutes.js";
import daysRoutes from "./routes/daysRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import activitiesRoutes from "./routes/activitiesRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import likesRoutes from "./routes/likesRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import routesAPIRoutes from "./routes/routesAPIRoutes.js";
import shareRoutes from "./routes/sharedTripsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import http from "http";
import {Server} from "socket.io";

const app = express();

// connect to Neon
export const sql = neon(process.env.DATABASE_URL);

// middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://app.planit-travel.me",
      "https://www.planit-travel.me",
      "https://planit-travel.me",
    ],
    credentials: true,
  })
);
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

// Export io instance to be used by controllers
export const getIO = () => io;

// Handle connections(room implementation will be done here)
io.on("connection", (socket) => {
  socket.on("joinTrip", function(roomName) {
    socket.join(roomName);
    socket.roomName = roomName;
    console.log("Participant connected to room:", roomName);
  });


  socket.on("disconnect", () => {
    socket.leave(socket.roomName);
    console.log("Participant disconnected from room:", socket.roomName);
  });
});

app.use(helmet());
app.use(morgan("dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7, // This is the lifetime of the cookie in milliseconds (1 week)
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/placesAPI", placesAPIRoutes);
app.use("/days", daysRoutes);
app.use("/trip", tripRoutes);
app.use("/activities", activitiesRoutes);
app.get("/health", (_req, res) => res.json({ ok: true, service: "api" }));
app.use("/image", imageRoutes);
app.use("/likes", likesRoutes);
app.use("/explore", exploreRoutes);
app.use("/routesAPI", routesAPIRoutes);
app.use("/shared" , shareRoutes)
app.use("/settings", settingsRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
);

export default app; // <- export the app for tests