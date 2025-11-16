import {storeProfilePicture, retrieveProfilePicture} from "../controllers/profilePictureController.js";
import express from "express";
const router = express.Router();

router.put("/store", storeProfilePicture);
router.get("/retrieve", retrieveProfilePicture);

export default router;