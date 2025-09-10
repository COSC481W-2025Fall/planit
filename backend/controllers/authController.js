
// export const home = (req, res) => {
//   res.send('<a href="/auth/google">Authenticate with Google</a>');
// };

export const googleAuth = (req, res, next) => {
  // This route is only used to trigger passport.authenticate,
  // no logic needed here because it's handled by Passport
  next();
};

export const googleCallback = (req, res) => {
  // Passport handles redirect logic, so no body here either
};

// export const dashboard = (req, res) => {
//   res.send(`Hello ${req.user.displayName}`);
// };

export const authFailure = (req, res) => {
  res.send("Failed to authenticate..");
};
