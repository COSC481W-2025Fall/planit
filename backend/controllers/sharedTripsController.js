import { sql } from "../config/db.js";

// list all trips shared with the logged-in user
export const readAllSharedTrips = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ loggedIn: false });
    }

    try {
        const userId = req.user.user_id;

        const result = await sql`
        SELECT *
        FROM shared
        WHERE user_id = ${userId}
    `

        res.json({ loggedIn: true, sharedTrips: result });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// add participant to a shared trip (trip owner only)
export const addParticipant = async (req, res) => {
    if (!req.trip || req.tripPermission !== "owner") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const tripId = req.trip.trips_id;
    const { username } = req.body;

    if (!tripId || !username) {
        return res.status(400).json({ error: "tripId and username are required" });
    }

    try {
        const [user] = await sql`
        SELECT user_id
        FROM users
        WHERE username = ${username}
    `;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.user_id === req.user.user_id) {
            return res.status(400).json({ error: "Cannot add yourself as a participant" });
        }

        await sql`
        INSERT INTO shared (trip_id, user_id)
        VALUES (${tripId}, ${user.user_id})
        ON CONFLICT (trip_id, user_id) DO NOTHING
    `;
        res.json({ message: "Participant added to shared trip." });
    }
    catch (err) {
        console.log("Error adding participant:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// remove participant from a shared trip (trip owner only)
export const removeParticipant = async (req, res) => {
    if (!req.trip || req.tripPermission !== "owner") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const tripId = req.trip.trips_id;
    const { username } = req.body;

    if (!tripId || !username) {
        return res.status(400).json({ error: "tripId and username are required" });
    }

    try {
        const [user] = await sql`
        SELECT user_id
        FROM users
        WHERE username = ${username}
    `;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const result = await sql`
        DELETE FROM shared
        WHERE trip_id = ${tripId} AND user_id = ${user.user_id}
    `;
        if (result.count === 0) {
            return res.status(404).json({ error: "Participant not found in shared trip" });
        }

        res.json({ message: "Participant removed from shared trip." });
    }
    catch (err) {
        console.log("Error removing participant:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// list all participants in a shared trip
export const listParticipants = async (req, res) => {
    if (!req.trip || (req.tripPermission !== "owner" && req.tripPermission !== "shared")) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const tripId = req.trip.trips_id;
    try {
        const result = await sql`
        SELECT user_id, username
        FROM users
        JOIN shared ON users.user_id = shared.user_id
        WHERE shared.trip_id = ${tripId}
        ORDER BY username ASC
    `;
        res.json({ participants: result });
    }
    catch (err) {
        console.log("Error listing participants:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};