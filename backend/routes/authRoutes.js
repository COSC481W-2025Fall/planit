import express from "express";
import passport from "passport";
import {googleAuth, googleCallback, authFailure , loginDetails, fetchUserTrips} from "../controllers/authController.js";

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
  "/login/details",
  loginDetails
);

router.get("/user/trips",
  fetchUserTrips
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure"}),
  async (req, res) => {
    try{
      // Successful authentication, check if user has no username or their username is NULL, if true, redirect to username creation page
      if(!req.user.username || req.user.username.trim() === "NULL"){
        return res.redirect("http://localhost:5173/user");
      }
      // If user has a username, redirect to trip page
      else{
        return res.redirect("http://localhost:5173/trip");
      }
    }
    catch(err){
      console.error("Error during Google callback:", err);
      return res.redirect("/auth/failure");
    }
  }
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
