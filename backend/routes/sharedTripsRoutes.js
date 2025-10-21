import express from "express";
import { isLoggedIn } from "../auth.js";
import { loadEditableTrip } from "../middleware/loadEditableTrip.js";
import { loadOwnedTrip } from "../middleware/loadOwnedTrip.js";
import { addParticipant, removeParticipant, listParticipants, listMySharedTrips, } from "../controllers/sharedTripsController.js";
const router = express.Router();

router.post("/addParticipant", isLoggedIn, loadOwnedTrip, addParticipant);
router.delete("/removeParticipant", isLoggedIn, loadOwnedTrip, removeParticipant);
router.get("/listParticipants", isLoggedIn, loadEditableTrip, listParticipants);
router.get("/listMySharedTrips", isLoggedIn, listMySharedTrips);

export default router;