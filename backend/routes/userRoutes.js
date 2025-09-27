/*
Routes for user-related operations: create username, modify user, read user, delete user.
*/
import { createUsername, updateUser, readUser, deleteUser } from "../controllers/userController.js";
import express from "express";
const router = express.Router();

router.post("/create", createUsername);
router.put("/update", updateUser);
router.get("/read", readUser);
router.delete("/delete", deleteUser);

export default router;