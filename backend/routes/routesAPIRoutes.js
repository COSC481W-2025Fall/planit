import express from "express";
import {distanceByTransportation} from "../controllers/routesAPIController.js";
const router = express.Router();

router.post("/distance/between/each/activity" , distanceByTransportation);

export default router;