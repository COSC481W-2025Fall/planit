import express from "express"; 
import { addTransportInfo, updateTransportInfo, readTransportInfo, deleteTransportInfo, addAccommodationInfo, readAccommodationInfo, updateAccommodationInfo, deleteAccommodationInfo } from "../controllers/travelAccommodationController.js";

const router = express.Router(); 

router.post("/addTransportInfo", addTransportInfo);
router.get("/readTransportInfo", readTransportInfo);
router.put("/updateTransportInfo", updateTransportInfo);
router.delete("/deleteTransportInfo", deleteTransportInfo);
router.post("/addAccommodationInfo", addAccommodationInfo);
router.get("/readAccommodationInfo", readAccommodationInfo);
router.put("/updateAccommodationInfo", updateAccommodationInfo);
router.delete("/deleteAccommodationInfo", deleteAccommodationInfo);

export default router;