import express from "express";
import { searchPlaces, getNumberOfDays, addActivity } from "../controllers/activitiesController.js";

const router = express.Router();

router.post("/search", searchPlaces);
// router.get("/details", getPlaceDetails);
router.post("/add", addActivity);
// router.get("/get/number/of/days" , getNumberOfDays);
// router.post("/", saveActivity);

export default router;
