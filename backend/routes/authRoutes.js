import express from "express";
import passport from "passport";
import { home, googleAuth, googleCallback, dashboard, authFailure } from "../controllers/authController.js";

const router = express.Router();

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

router.get("/", home);

router.get(
  "/google",
  googleAuth,
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/dashboard",
    failureRedirect: "/auth/failure",
  }),
  googleCallback
);

router.get("/dashboard", isLoggedIn, dashboard);

router.get("/failure", authFailure);

export default router;
