import express from "express"; 
import { getParticipantTripCount, getParticipantLongestTrip, getParticipantTotalLikes, getParticipantCheapestTrip, getParticipantMostExpensiveTrip, getParticipantTotalMoneySpent } from "../controllers/settingsParticipantController.js";

const router = express.Router();

router.post("/tripCount", getParticipantTripCount);
router.post("/longestTrip", getParticipantLongestTrip);
router.post("/totalLikes", getParticipantTotalLikes);
router.post("/cheapestTrip", getParticipantCheapestTrip);
router.post("/mostExpensiveTrip", getParticipantMostExpensiveTrip);
router.post("/totalMoneySpent", getParticipantTotalMoneySpent);
export default router; 