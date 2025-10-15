import express from "express";
import { createLike, removeLike, getAllLikesForUser, getTopLikedTrips, getTrendingTrips } from "../controllers/likesController.js";

const router = express.Router();

router.post("/add/like", createLike);
router.delete("/remove/like", removeLike);
router.get("/all/likes/user", getAllLikesForUser);


export default router;