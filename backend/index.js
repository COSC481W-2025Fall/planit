import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { neon } from "@neondatabase/serverless";

import "./auth.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// connect to Neon
const sql = neon(process.env.DATABASE_URL);

// middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// use auth routes
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
