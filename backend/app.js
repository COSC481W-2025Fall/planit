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
app.use("/placesAPI", placesAPIRoutes);
app.use("/days", daysRoutes);
app.use("/trip", tripRoutes);
app.get("/health", (_req, res) => res.json({ ok: true, service: "api" }));

export default app; // <- export the app for tests
