/*
Routes for necessary image CRUD operations, read all images, and read one image
*/
import { readAllImages, readOneImage } from "../controllers/imageController.js";
import express from "express";
const router = express.Router();

router.get("/readall", readAllImages);
router.get("/readone", readOneImage);

export default router;