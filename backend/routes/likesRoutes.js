import express from "express";
import { toggleLike, getAllTripDetailsOfATripLikedByUser, getLikedTripIdsByUser} from "../controllers/likesController.js";

const router = express.Router();

router.post("/toggle", toggleLike);
router.post("/all/trip/details", getAllTripDetailsOfATripLikedByUser);
router.post("/all/tripId/liked/by/user", getLikedTripIdsByUser); 


export default router;