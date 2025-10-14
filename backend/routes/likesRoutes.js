import express from "express";
import { createLike, removeLike, getAllLikesForUser, getTopLikedTrips } from "../controllers/likesController.js";


router.post("/add/like", createLike);
router.delete("/remove/like", removeLike);
router.get("/all/likes/user", getAllLikesForUser);
router.get("/top/liked/trips", getTopLikedTrips);


export default router;