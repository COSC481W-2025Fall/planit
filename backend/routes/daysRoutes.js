import express from "express";
// imports
import { 
  readDays,
  createDay,
  updateDay,
  deleteDay
} from "../controllers/daysController.js";
import { isLoggedIn } from "../auth.js";
import { loadTripWithPermissions } from "../middleware/loadTripWithPermissions.js";

// create router
const router = express.Router();

// routes
router.get("/trips/:tripId/days", isLoggedIn, loadTripWithPermissions, readDays);
router.post("/trips/:tripId/days", isLoggedIn, loadTripWithPermissions, createDay);
router.put("/trips/:tripId/days/:id", isLoggedIn, loadTripWithPermissions, updateDay);
router.delete("/trips/:tripId/days/:id", isLoggedIn, loadTripWithPermissions, deleteDay);

// export router
export default router;