import express from "express"; 
import { addTransportInfo, addAccomodationInfo } from "../controllers/travelAccomodationController.js";

const router = express.Router(); 

router.post("/addTransportInfo", addTransportInfo);
router.post("/addAccomodationInfo", addAccomodationInfo);

export default router;