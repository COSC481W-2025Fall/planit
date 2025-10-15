import { sql } from "../config/db.js";

export const createLike = async (req, res) => {
    try {
        //the params that are needed to pass to this function is userId and tripId
        const { userId, tripId } = req.body;

        if (!userId || !tripId) {
            return res.status(400).json({ error: "userId and tripId are required" });
        }

        //insert a like into db
        const newLike = await sql`
            INSERT INTO likes (user_id, trip_id)
            VALUES (${userId}, ${tripId})
            RETURNING *
        `;

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const deleteLike = async (req, res) => {
    try {
        const { userId, tripId } = req.body;

        if (!userId || !tripId) {
            return res.status(400).json({ error: "userId and tripId are required" });
        }

        const deletedLike = await sql`
            DELETE FROM likes
            WHERE user_id = ${userId} AND trip_id = ${tripId}
            RETURNING *
        `;
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getLikesByUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const userLikes = await sql`
            SELECT t.trips_id, t.trip_name, t.trip_location, t.trip_start_date, t.trip_updated_at, l.liked_at
            FROM trips AS t
            JOIN likes AS l ON t.trips_id = l.trip_id
            WHERE l.user_id = ${userId}
            ORDER BY l.liked_at DESC
        `;

        return res.status(200).json(userLikes);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
