import express from "express";
import { 
    readDays,
    createDay
} from "../controllers/daysController.js";
import { isLoggedIn } from "../auth.js";
import { loadOwnedTrip } from "../middleware/loadOwnedTrip.js";

const router = express.Router();

router.get("/trips/:tripId/days", isLoggedIn, loadOwnedTrip, readDays);
router.post("/trips/:tripId/days", isLoggedIn, loadOwnedTrip, createDay);

export default router;