import express from "express";
import { addActivity, deleteActivity, updateActivity, readSingleActivity, readAllActivities} from "../controllers/activitiesController.js";

const router = express.Router();

router.delete("/delete", deleteActivity);
router.post("/create", addActivity);
router.put("/update", updateActivity);
router.get("/read/single", readSingleActivity);
router.get("/read/all", readAllActivities);

export default router;
