import express from "express";
import { getWeatherForecast } from "../controllers/weatherController.js";

const router = express.Router();

router.post("/getWeather", getWeatherForecast);

export default router;