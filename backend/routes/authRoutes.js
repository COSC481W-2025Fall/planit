import express from "express";
import passport from "passport";
import {googleAuth, googleCallback, authFailure , loginDetails, fetchUserTrips} from "../controllers/authController.js";
import {LOCAL_BACKEND_URL, LOCAL_FRONTEND_URL, VITE_BACKEND_URL, VITE_FRONTEND_URL} from "../../Constants.js";

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
  passport.authenticate("google", {
    successRedirect: (process.env.ENVIRONMENT === "production" ? VITE_FRONTEND_URL : LOCAL_FRONTEND_URL) + "/trip",
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
