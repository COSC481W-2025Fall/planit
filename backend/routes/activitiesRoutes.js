import express from "express";
import { addActivity, deleteActivity, updateActivity, readSingleActivity, readAllActivities} from "../controllers/activitiesController.js";

const router = express.Router();

router.delete("/delete", deleteActivity);
router.post("/create", addActivity);
router.update("/update", updateActivity);
router.read("/read/single", readSingleActivity);
router.read("/read/all", readAllActivities);

export default router;
