import {neon} from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing.");
}

export const sql = neon(DATABASE_URL);