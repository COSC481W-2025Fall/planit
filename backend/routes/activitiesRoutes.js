import express from "express";
import { addActivity, deleteActivity, updateActivity, readSingleActivity, readAllActivities} from "../controllers/activitiesController.js";

const router = express.Router();

router.delete("/delete", deleteActivity);
router.post("/create", addActivity);
router.update("/update", updateActivity);
router.read("/read", readSingleActivity);
router.read("/read", readAllActivities);

export default router;
