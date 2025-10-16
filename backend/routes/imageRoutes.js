/*
Routes for user-related operations: create username, modify user, read user, delete user.
*/
import { readAllImages, assignImageToTrip, getImageById } from "../controllers/imageController.js";
import express from "express";
const router = express.Router();

router.get("/readall", readAllImages);
router.post("/assign", assignImageToTrip);
router.get("/image", getImageById);

export default router;