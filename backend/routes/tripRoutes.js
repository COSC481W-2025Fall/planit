/*
Routes for trip-related operations: create a trip, modify a trip, read a trip, and delete a trip.
*/
import {createTrip, readTrip, updateTrip, deleteTrip, fetchUserTrips, getOwnerForTrip} from "../controllers/tripController.js";
import { cloneTrip, getCloneData } from "../controllers/cloneTripController.js";
import { isLoggedIn } from "../auth.js";
import express from "express";
const router = express.Router();

router.get("/:tripId/cloneData", isLoggedIn, getCloneData);
router.post("/:tripId/clone", isLoggedIn, cloneTrip);
router.post("/create", createTrip);
router.put("/update", updateTrip);
router.get("/owner/:tripId", getOwnerForTrip);
router.get("/readAll", fetchUserTrips);
router.get("/read/:tripId", readTrip);
router.delete("/delete", deleteTrip);

export default router;