/*
Routes for trip-related operations: create a trip, modify a trip, read a trip, and delete a trip.
*/
import {createTrip, readTrip, deleteTrip} from "../controllers/tripController.js";
import express from "express";
const router = express.Router();

router.post("/create", createTrip);
// router.put("/modify", modifyUser);
router.get("/read/:tripId", readTrip);
router.delete("/delete", deleteTrip);

export default router;