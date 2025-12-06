/* This controller class contains four functions that handle creating username, updating all fields in the user table,
and deleting a users account.
*/
import {sql} from "../config/db.js";
import session from "express-session";

const REGEX_USERNAME = /^(?!.*__)[A-Za-z0-9_]{2,20}$/;

//This function handles the creation of a username for a user.
export const createUsername = async (req, res) => {
    try {
        const { userId, createUsername } = req.body;

        if (!REGEX_USERNAME.test(createUsername)){
            return res.status(400).json({ error: "Invalid. Letters, numbers, and '_' only. Min length: 2, max length: 20" });
        }

        const result = await sql`
            UPDATE users
            SET username = ${createUsername}
            WHERE user_id = ${userId}
            AND username IS NULL
            RETURNING *
        `
        // If no rows were updated, it means the username already exists, send an error response
        if (result.length === 0) {
            return res.status(400).json({ error: "User already has a username" });
        }

        const createdUser = result[0];

        req.login(createdUser, (err) => {
            if (err) {
                console.error("Error refreshing session after username creation:", err);
                return res.status(500).json({error: "Error refreshing session after username creation:"});
            }
            return res.json({ success: true, user: createdUser });
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//This function handles the modification of the three desired fields in the user table.
export const updateUser = async (req, res) => {
  try {
    const { userId, firstname, lastname, username, customPhoto} = req.body;

    if (username === undefined || username === null || username === ""){
        return res.status(400).json({ error: "Username cannot be null" });
    }

      if (!REGEX_USERNAME.test(username)){
          return res.status(400).json({ error: "Invalid. Letters, numbers, and '_' only. Min length: 2, max length: 20" });
      }

    if (!userId || !customPhoto || firstname === undefined || lastname === undefined || username === undefined) {
      return res.status(400).json({ error: "userId, first name, last name, and username are required" });
    }

    //This is a check using regex to ensure a proper format has been sent
    const base64Pattern = /^data:image\/(jpeg|png);base64,/;
    if (!base64Pattern.test(customPhoto)) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    const result = await sql`
    UPDATE users
    SET first_name = ${firstname},
      last_name = ${lastname},
      username = ${username},
      photo = ${customPhoto}
      WHERE user_id = ${userId}
      RETURNING *`;

      if (result.length === 0) {
          return res.status(400).json({ error: "User already has a username" });
      }

    const updatedUser = result[0];

    //Refresh session with updated user, this ensures that req.user contains the updated information, preventing a stale session.
    req.login(updatedUser, (err) => {
      if (err) {
        console.error("Error refreshing session after update:", err);
        return res.status(500).json({error: "Error refreshing session after update:"});
      }
        return res.json({ success: true, user: updatedUser });
    });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


//This function reads the information in the user table for a specific user.
export const readUser = async (req, res) => {
  if (!req.user) return res.status(400).json({ loggedIn: false });

  try {
    const userId = req.user.user_id;

    const result = await sql`
    SELECT first_name, last_name, username, email
    FROM users
    WHERE user_id = ${userId}
    `;

    if (result.length === 0)
      return res.status(400).json({ error: "User not found" });

    res.json({ loggedIn: true, user: result[0] });
  } 
  catch (err) {
    console.error("Error reading user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//This function handles the complete deletion of a user.
export const deleteUser = async (req, res) => {
  if (!req.user) return res.status(400).json({ loggedIn: false });

  try {
    const userId = req.user.user_id;

    const result = await sql`
    DELETE FROM users
    WHERE user_id = ${userId}
    RETURNING *
    `;

    if (result.length === 0)
    return res.status(400).json({ error: "User not found" });

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to destroy session" });
      }
      
      // clear the session cookie
      res.clearCookie("connect.sid");
      
      // Send success response
      res.json({ 
        loggedIn: false, 
        message: "Account deleted successfully" 
      });
    });
  } 
  catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};