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
