/*
Routes for trip-related operations: create a trip, modify a trip, read a trip, and delete a trip.
*/
import {createTrip, readTrip, updateTrip, deleteTrip, fetchUserTrips, getAllTripLocations} from "../controllers/tripController.js";
import express from "express";
const router = express.Router();

router.post("/create", createTrip);
router.put("/update", updateTrip);
router.get("/read/:tripId", readTrip);
router.get("/readAll", fetchUserTrips);
router.delete("/delete", deleteTrip);
router.get("/all/trip/locations", getAllTripLocations);

export default router;