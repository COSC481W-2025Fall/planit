import express from "express";
// imports
import {
    readDays,
    createDay,
    updateDay,
    deleteDay
} from "../controllers/daysController.js";
import { isLoggedIn } from "../auth.js";
import { loadTripPermissions } from "../middleware/loadTripPermissions.js";

// create router
const router = express.Router();

// routes
router.get("/trips/:tripId/days", isLoggedIn, loadTripPermissions, readDays);
router.post("/trips/:tripId/days", isLoggedIn, loadTripPermissions, createDay);
router.put("/trips/:tripId/days/:id", isLoggedIn, loadTripPermissions, updateDay);
router.delete("/trips/:tripId/days/:id", isLoggedIn, loadTripPermissions, deleteDay);

// export router
export default router;