import {neon} from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const {PGHOST, PGUSER, PGPASSWORD, PGDATABASE} = process.env;

if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
  throw new Error("Database configuration variables are missing.");
}

export const sql = neon(
  `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require`);