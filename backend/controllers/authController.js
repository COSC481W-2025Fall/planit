import {sql} from "../config/db.js";

export const googleAuth = (req, res, next) => {
  // This route is only used to trigger passport.authenticate,
  // no logic needed here because it's handled by Passport
  next();
};

export const googleCallback = (req, res) => {
  // Passport handles redirect logic, so no body here either
};

export const fetchUserTrips = async (req, res) => {
  if (!req.user)
  {
    return res.status(401).json({ loggedIn: false });
  }
 
  try
  {
    const userId = req.user.id;

    // query the database for trips associated with the logged-in user
    const trips = await sql`
      SELECT *
      FROM trips
      WHERE user_id = ${userId}
    `

    res.json({ loggedIn: true, trips: trips });
  } 
  catch (err)
  {
  console.log(err);
  return res.status(500).json({ error: "Internal Server Error" });
  }

}

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
