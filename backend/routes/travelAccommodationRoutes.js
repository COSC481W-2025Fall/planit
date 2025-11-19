import express from "express"; 
import { addTransportInfo, addAccommodationInfo } from "../controllers/travelAccommodationController.js";

const router = express.Router(); 

router.post("/addTransportInfo", addTransportInfo);
router.post("/addAccommodationInfo", addAccomodationInfo);

export default router;