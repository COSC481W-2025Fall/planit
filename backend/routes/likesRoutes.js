import express from "express";
import { toggleLike,getAllLikesByUser} from "../controllers/likesController.js";

const router = express.Router();

router.post("/toggle", toggleLike);
router.post("/all/likes/user", getAllLikesByUser);


export default router;