import express from "express";
import { searchTrips, getAllTripLocations, getTopLikedTrips, getTrendingTrips, getRecentTrips} from "../controllers/exploreController.js";

const router = express.Router();

router.post("/search", searchTrips)
router.post("/all/trip/locations", getAllTripLocations);
router.post("/top/liked/trips", getTopLikedTrips);
router.post("/trending" , getTrendingTrips);
router.post("/recent", getRecentTrips);

export default router;