import { sql } from "../config/db.js";

// read all shared trips for the logged-in user
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