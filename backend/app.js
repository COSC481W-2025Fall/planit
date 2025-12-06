import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config();
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
import travelAccommodationRoutes from "./routes/travelAccommodationRoutes.js";
import settingsParticipantRoutes from "./routes/settingsParticipantRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
//import rateLimit from "express-rate-limit";


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

// // short-term limit
// const perMinuteLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 200,            // 100 requests/minute
//   message: "Too many requests, please slow down.",
// });

// // medium-term limit (hourly)
// const perHourLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 6000,                // 6000 requests/hour
//   message: "Hourly rate limit reached.",
// });

// // long-term limit (daily)
// const perDayLimiter = rateLimit({
//   windowMs: 24 * 60 * 60 * 1000, // 24h
//   max: 50000,                     // 50k requests/day
//   message: "Daily rate limit reached.",
// });

// // Apply globally
// app.use(perMinuteLimiter);
// app.use(perHourLimiter);
// app.use(perDayLimiter);

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
app.use("/transport", travelAccommodationRoutes);
app.use("/settingsParticipant", settingsParticipantRoutes);
app.use("/weather", weatherRoutes);


export default app; // <- export the app for tests