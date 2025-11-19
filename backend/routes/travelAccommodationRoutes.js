import express from "express"; 
import { addTransportInfo, updateTransportInfo, readTransportInfo, deleteTransportInfo, addAccommodationInfo } from "../controllers/travelAccommodationController.js";

const router = express.Router(); 

router.post("/addTransportInfo", addTransportInfo);
router.get("/readTransportInfo", readTransportInfo);
router.put("/updateTransportInfo", updateTransportInfo);
router.delete("/deleteTransportInfo", deleteTransportInfo);
router.post("/addAccommodationInfo", addAccomodationInfo);

export default router;