import { readAllSharedTrips } from "../controllers/sharedTripsController";
import express from "express";
const router = express.Router();

router.get("/readAll", readAllSharedTrips);

export default router;