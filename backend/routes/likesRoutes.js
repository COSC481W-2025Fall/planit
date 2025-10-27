import express from "express";
import { toggleLike, getAllTripDetailsOfTripsLikedByUser} from "../controllers/likesController.js";

const router = express.Router();

router.post("/toggle", toggleLike);
router.post("/all/trip/details", getAllTripDetailsOfTripsLikedByUser);


export default router;