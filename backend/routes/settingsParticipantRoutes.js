import express from "express"; 
import { getAllParticipantSettings } from "../controllers/settingsParticipantController.js";

const router = express.Router();

router.post("/getAllParticipantSettings", getAllParticipantSettings);

export default router;