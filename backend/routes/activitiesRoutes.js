import express from "express";
import { addActivity, deleteActivity, updateActivity, readSingleActivity, readAllActivities, updateNotesForActivity, checkOverlappingTimes, checkOverlappingTimesForEdit} from "../controllers/activitiesController.js";

const router = express.Router();

router.delete("/delete", deleteActivity);
router.post("/create", addActivity);
router.put("/update", updateActivity);
router.get("/read/single", readSingleActivity);
router.post("/read/all", readAllActivities);
router.post("/updateNotes" , updateNotesForActivity);
router.post("/check-overlap", checkOverlappingTimes);
router.post("/check-overlap-edit", checkOverlappingTimesForEdit); 

export default router;
