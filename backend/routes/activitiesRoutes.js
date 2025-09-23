import express from "express";
import { addActivity, deleteActivity } from "../controllers/activitiesController.js";

const router = express.Router();

// router.post("/read", searchPlaces);
router.delete("/delete", deleteActivity);
router.post("/create", addActivity);

export default router;
