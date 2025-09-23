import express from "express";
import { 
    readDays,
    createDay,
    updateDay,
    deleteDay
} from "../controllers/daysController.js";
import { isLoggedIn } from "../auth.js";
import { loadOwnedTrip } from "../middleware/loadOwnedTrip.js";

const router = express.Router();

router.get("/trips/:tripId/days", isLoggedIn, loadOwnedTrip, readDays);
router.post("/trips/:tripId/days", isLoggedIn, loadOwnedTrip, createDay);
router.put("/trips/:tripId/days/:id", isLoggedIn, loadOwnedTrip, updateDay);
router.delete("/trips/:tripId/days/:id", isLoggedIn, loadOwnedTrip, deleteDay);

export default router;