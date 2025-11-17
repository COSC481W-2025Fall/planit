import { sql } from "../config/db.js";

//Endpoint to get all participant settings stats
export const getAllParticipantSettings = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }

        const [
            tripCount,
            longestTrip,
            totalLikes,
            cheapestTrip,
            mostExpensiveTrip,
            totalMoneySpent
        ] = await Promise.all([

            //Total trip count
            sql`
            SELECT COUNT(*) AS tripcount
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
        `,

            //Longest trip
            sql`
            SELECT t.trip_name, t.trips_id AS trip_id, COUNT(d.day_id) AS total_days
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            JOIN days d ON d.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
            GROUP BY t.trips_id, t.trip_name
            ORDER BY total_days DESC
            LIMIT 1
        `,

            //Total likes
            sql`
            SELECT COUNT(l.like_id) AS total_likes
            FROM likes l
            JOIN trips t ON l.trip_id = t.trips_id
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
        `,

            //Cheapest trip
            sql`
            SELECT t.trip_name, t.trips_id AS trip_id
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
            ORDER BY t.trip_price_estimate ASC
            LIMIT 1
        `,

            //Most expensive trip
            sql`
            SELECT t.trip_name, t.trips_id AS trip_id
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
            ORDER BY t.trip_price_estimate DESC
            LIMIT 1
        `,

            //Total money spent
            sql`
            SELECT COALESCE(SUM(t.trip_price_estimate), 0) AS total_money_spent
            FROM trips t
            JOIN shared s ON s.trip_id = t.trips_id
            WHERE s.user_id = ${userID}
        `

        ]);

        return res.status(200).json({
            tripCount: tripCount[0].tripcount || 0,
            longestTrip: longestTrip?.[0] || null,
            totalLikes: totalLikes[0].total_likes || 0,
            cheapestTrip: cheapestTrip?.[0] || null,
            mostExpensiveTrip: mostExpensiveTrip?.[0] || null,
            totalMoneySpent: totalMoneySpent[0].total_money_spent || 0
        });

    } catch (err) {
        console.error("Error fetching all settings:", err);
        return res.status(500).json({
            error: "Internal Server Error"
        })
    }
};