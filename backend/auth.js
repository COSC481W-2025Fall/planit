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
    const photo = profile.photos[0].value;
    // const user = {
    //   name: name,
    //   email: email,
    //   photo: photo,
    // };

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

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});