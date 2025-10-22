import { sql } from "../config/db.js";

// list all trips shared with the logged-in user
export const readAllSharedTrips = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ loggedIn: false });
    }

    try {
        const userId = req.user.user_id;

        const sharedTrips = await sql`
        SELECT *
        FROM shared
        WHERE user_id = ${userId}
    `

        res.json({ loggedIn: true, sharedTrips: sharedTrips });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// add participant to a shared trip (trip owner only)
export const addParticipant = async (req, res) => { 
    if (!req.trip || req.tripPermission !== "owner") {
        return res.status(403).json({ error: "Forbidden" });
    }

}

// remove participant from a shared trip (trip owner only)
export const removeParticipant = async (req, res) => {
    if (!req.trip || req.tripPermission !== "owner") {
        return res.status(403).json({ error: "Forbidden" });
    }
}

// list all participants in a shared trip
export const listParticipants = async (req, res) => {
    if (!req.trip || (req.tripPermission !== "owner" && req.tripPermission !== "shared")) {
        return res.status(403).json({ error: "Forbidden" });
    }
}