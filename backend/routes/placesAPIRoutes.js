import express from "express";
import { findPlaces } from "../controllers/placesAPIController.js";

const router = express.Router();

router.post("/search", findPlaces);

export default router;

