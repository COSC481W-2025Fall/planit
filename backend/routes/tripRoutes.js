/*
Routes for trip-related operations: create a trip, modify a trip, read a trip, and delete a trip.
*/
import {createTrip, readTrip, updateTrip, deleteTrip, fetchUserTrips, getOwnerForTrip} from "../controllers/tripController.js";
import express from "express";
import {health, predictItems} from "../controllers/packingPredictController.js";
const router = express.Router();

router.post("/create", createTrip);
router.put("/update", updateTrip);
router.get("/read/:tripId", readTrip);
router.get("/readAll", fetchUserTrips);
router.delete("/delete", deleteTrip);
router.get("/owner/:tripId", getOwnerForTrip);
router.get("/healthAI", health);
router.post("/packing/predict", predictItems);

export default router;