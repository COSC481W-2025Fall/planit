import dotenv from 'dotenv';
dotenv.config(); 

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {sql} from './config/db.js';
import {VITE_BACKEND_URL, LOCAL_BACKEND_URL} from "../Constants.js";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: (process.env.ENVIRONMENT === "production" ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/google/callback",
  passReqToCallback: true,
},
async function(request, accessToken, refreshToken, profile, done) {
   try
   {
    const name = profile.displayName;

    const nameParts = name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";
    const email = profile.emails[0].value;
    const photo = "data:image/jpeg;base64,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";

    // I need to check if this user already exists in the database
    // if not, I need to create a new user in the database
    // if they do exist, I need to return the user from the database
    const existingUser = await sql `
    SELECT * 
    FROM users 
    WHERE email = ${email}
    `;

    let user ;

    // if the length of the result we just queried is 0 , then we know this must be a  new user
    if(existingUser.length === 0)
    {
      const newUser = await sql `
        INSERT INTO users 
        (first_name,last_name,email,photo) 
        VALUES (${firstName},${lastName},${email},${photo}) 
        RETURNING *
      `;
      user = newUser[0];
    } 
    else 
    {
      user = existingUser[0];
    }
    

    return done(null, user);
   } catch(err)
   {
    return done(err,null);
   }
}));

export function isLoggedIn(req, res, next) {
  if(!req.user) {
    return res.status(401).json({ loggedIn: false });
  }
  next();
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});