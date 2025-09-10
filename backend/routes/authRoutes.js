import express from "express";
import passport from "passport";
import {googleAuth, googleCallback, authFailure } from "../controllers/authController.js";

const router = express.Router();

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// router.get("/", home);

router.get(
  "/google",
  googleAuth,
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/trip",
    failureRedirect: "/auth/failure",
  }),
  googleCallback
);

router.get("/user", (req, res) => {
  if (req.user) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});



// router.get("/dashboard", isLoggedIn, dashboard);

router.get("/failure", authFailure);

export default router;
