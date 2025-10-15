import express from "express";
import { searchTrips, getAllTripLocations, getTopLikedTrips, getTrendingTrips} from "../controllers/exploreController.js";

const router = express.Router();

router.get("/search", searchTrips)
router.get("/all/trip/locations", getAllTripLocations);
router.get("/top/liked/trips", getTopLikedTrips);
router.get("/trending" , getTrendingTrips);

export default router;