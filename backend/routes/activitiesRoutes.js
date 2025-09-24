import express from "express";
import { addActivity, deleteActivity} from "../controllers/activitiesController.js";

const router = express.Router();

router.delete("/delete", deleteActivity);
router.post("/create", addActivity);
router.update("/update", updateActivity);

export default router;
