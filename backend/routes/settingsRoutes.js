import express from "express"; 
import { getAllSettings } from "../controllers/settingsController.js";

const router = express.Router();

router.post("/getAllSettings", getAllSettings);

export default router; 