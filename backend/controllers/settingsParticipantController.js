import { sql } from "../config/db.js";

// Number of trips a user is a participant in
export const getParticipantTripCount = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const result = await sql`
            SELECT COUNT(*) AS tripCount
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
        `;

        return res.status(200).json({ tripCount: result[0].tripCount ?? 0 });
    } catch (err) {
        console.error("Error fetching participant trip count:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Longest trip a user is a participant in
export const getParticipantLongestTrip = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const result = await sql`
            SELECT t.trip_name, t.trips_id, COUNT(d.day_id) AS total_days
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            JOIN days d ON d.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
            GROUP BY t.trips_id, t.trip_name
            ORDER BY total_days DESC
            LIMIT 1
        `;

        return res.status(200).json(result[0] ?? null);
    } catch (err) {
        console.error("Error fetching participant longest trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Total likes across all trips a user is a participant in
export const getParticipantTotalLikes = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const result = await sql`
            SELECT COUNT(l.like_id) AS total_likes
            FROM likes l
            JOIN trips t ON l.trip_id = t.trips_id
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
        `;

        return res.status(200).json({ totalLikes: result[0].total_likes ?? 0 });
    } catch (err) {
        console.error("Error fetching participant total likes:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// Cheapest trip a user is a participant in
export const getParticipantCheapestTrip = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const result = await sql`
            SELECT t.trip_name, t.trips_id
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
            ORDER BY t.trip_price_estimate ASC
            LIMIT 1
        `;

        return res.status(200).json(result[0] ?? null);
    } catch (err) {
        console.error("Error fetching participant cheapest trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Most expensive trip a user is a participant in
export const getParticipantMostExpensiveTrip = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const result = await sql`
            SELECT t.trip_name, t.trips_id
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
            ORDER BY t.trip_price_estimate DESC
            LIMIT 1
        `;

        return res.status(200).json(result[0] ?? null);
    } catch (err) {
        console.error("Error fetching participant most expensive trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// Total estimated money spent across all trips a user is a participant in
export const getParticipantTotalMoneySpent = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const result = await sql`
            SELECT COALESCE(SUM(t.trip_price_estimate), 0) AS total_money_spent
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
        `;

        return res.status(200).json({ totalMoneySpent: result[0].total_money_spent ?? 0 });
    } catch (err) {
        console.error("Error fetching participant total money spent:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};