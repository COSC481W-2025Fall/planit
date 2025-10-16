import express from "express";
import { toggleLike, getAllTripDetailsOfTripsLikedByUser, getLikedTripIdsByUser} from "../controllers/likesController.js";

const router = express.Router();

router.post("/toggle", toggleLike);
router.post("/all/trip/details", getAllTripDetailsOfTripsLikedByUser);
router.post("/all/tripId/liked/by/user", getLikedTripIdsByUser); 


export default router;