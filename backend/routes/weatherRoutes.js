import express from "express";
import { getWeatherForecast } from "../controllers/weatherController.js";

const router = express.Router();

// GET /api/weather?lat=...&lon=...&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/getWeather", getWeatherForecast);

export default router;