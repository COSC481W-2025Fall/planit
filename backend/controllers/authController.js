import {LOCAL_FRONTEND_URL, VITE_FRONTEND_URL} from "../../Constants.js";
export const googleAuth = (req, res, next) => {
  // This route is only used to trigger passport.authenticate,
  // no logic needed here because it's handled by Passport
  next();
};

export const googleCallback = (req, res) => {
  // Passport handles redirect logic, so no body here either
};


export const loginDetails = (req, res) => {
  if (req.user) {
    res.json(req.user); 
  } else {
    res.status(401).json({ loggedIn: false });
  }
};

export const authFailure = (req, res) => {
  res.send("Failed to authenticate..");
};

export const guestLogin =(req, res) => {
  try {
    // unique guest identifier
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // temporary guest user object
    const guestUser = {
      user_id: guestId,
      username: `Guest_${Date.now().toString().slice(-6)}`,
      email: null,
      photo: null,
      isGuest: true,
      createdAt: new Date()
    };

    // store in session (not in database)
    req.login(guestUser, (err) => {
      if (err) {
        console.error("Guest login error:", err);
        return res.status(500).json({ error: "Failed to create guest session" });
      }

      // success with redirect URL
      res.json({
        success: true,
        redirectUrl: (process.env.ENVIRONMENT === "production" ? VITE_FRONTEND_URL : LOCAL_FRONTEND_URL) + "/explore"
      });
    });
  } catch (err) {
    console.error("Guest login error:", err);
    res.status(500).json({ error: "Failed to create guest session" });
  }
}
