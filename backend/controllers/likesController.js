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
            DELETE FROM Likes
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
            SELECT t.trips_id, t.trip_name, t.trip_location, t.days, t.trip_start_date, t.trip_updated_at, l.liked_at
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

export const getTopLikedTrips = async (req, res) => {
    try {

        // I am grabbing the top 10 liked trips of all time, if you want less than 10 just change the limit clause at the end of the query
        const topLikedTripsAllTime = await sql`
            SELECT t.trips_id, t.trip_name, t.trip_location, t.days, t.trip_start_date, t.trip_updated_at,
            COUNT(l.like_id) AS like_count
            FROM trips AS t
            LEFT JOIN likes AS l ON t.trips_id = l.trip_id
            GROUP BY t.trips_id
            ORDER BY like_count DESC
            LIMIT 10;
        `;

        return res.status(200).json(topLikedTripsAllTime);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
