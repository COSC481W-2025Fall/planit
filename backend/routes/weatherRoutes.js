import express from "express";
import {getWeatherForecast, getWeatherForecastForSingleDay} from "../controllers/weatherController.js";

const router = express.Router();

router.post("/getWeather", getWeatherForecast);
router.post("/getWeatherForecastForSingleDay", getWeatherForecastForSingleDay);

export default router;