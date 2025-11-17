import { sql } from "../config/db.js";

//Endpoint to get all user settings stats
export const getAllSettings = async (req, res) => {
    try {
        const {userID} = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
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
                SELECT COUNT(*) AS trip_count
                FROM trips
                WHERE user_id = ${userID}
            `,

            //Longest trip
            sql`
                SELECT t.trip_name, t.trips_id, COUNT(d.day_id) AS total_days
                FROM trips AS t
                JOIN days AS d ON t.trips_id = d.trip_id
                WHERE t.user_id = ${userID}
                GROUP BY t.trips_id, t.trip_name
                ORDER BY total_days DESC
                LIMIT 1
            `,

            //Total likes
            sql`
                SELECT COUNT(l.trip_id) AS total_likes
                FROM likes AS l
                JOIN trips AS t ON l.trip_id = t.trips_id
                WHERE t.user_id = ${userID}
            `,

            //Cheapest trip
            sql`
                SELECT trip_name, trips_id, trip_price_estimate
                FROM trips
                WHERE user_id = ${userID}
                ORDER BY trip_price_estimate ASC
                LIMIT 1
            `,

            //Most expensive trip
            sql`
                SELECT trip_name, trips_id, trip_price_estimate
                FROM trips
                WHERE user_id = ${userID}
                ORDER BY trip_price_estimate DESC
                LIMIT 1
            `,

            //Total money spent
            sql`
                SELECT COALESCE(SUM(trip_price_estimate), 0) AS total_money_spent
                FROM trips
                WHERE user_id = ${userID}
            `

        ]);

        return res.status(200).json({
            tripCount: tripCount[0].trip_count,
            longestTrip: longestTrip[0] || null,
            totalLikes: totalLikes[0].total_likes,     
            cheapestTrip: cheapestTrip[0] || null,
            mostExpensiveTrip: mostExpensiveTrip[0] || null,
            totalMoneySpent: totalMoneySpent[0].total_money_spent
        });
    } catch (err) {
        console.error("Error fetching all settings:", err);
        return res.status(500).json({ error: "Internal Server Error"
        })
    }
};