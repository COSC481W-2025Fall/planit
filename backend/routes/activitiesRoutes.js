import express from "express";
import { addActivity, deleteActivity, updateActivity} from "../controllers/activitiesController.js";

const router = express.Router();

router.delete("/delete", deleteActivity);
router.post("/create", addActivity);
// router.update("/update", updateActivity);
// router.read("/read", updateActivity);

export default router;
