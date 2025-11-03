import express from "express"; 
import { getTripCount, getLongestTrip, getTotalLikes, getCheapestTrip, getMostExpensiveTrip, getTotalMoneySpent } from "../controllers/settingsController.js";

const router = express.Router();

router.post("/tripCount", getTripCount);
router.post("/longestTrip", getLongestTrip);
router.post("/totalLikes", getTotalLikes);
router.post("/cheapestTrip", getCheapestTrip);
router.post("/mostExpensiveTrip", getMostExpensiveTrip);
router.post("/totalMoneySpent", getTotalMoneySpent);

export default router; 