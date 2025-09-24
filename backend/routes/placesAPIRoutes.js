import express from "express";
import { findPlaces, findCityAutocomplete } from "../controllers/placesAPIController.js";

const router = express.Router();

router.post("/search", findPlaces);
router.post("/cityAutocomplete", findCityAutocomplete);

export default router;

