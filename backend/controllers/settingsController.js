import { sql } from "../config/db.js";

//Endpoints needed
//trips made, longest trip, total likes, cheapest trip
//most expensive trip, and total money spent

//gets total trips made by a single user
export const getTripCount = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }

        const trip = await sql`
            SELECT COUNT(*) AS trip_count
            FROM trips
            WHERE user_id = ${userID}`;

            return res.status(200).json({ tripCount: trip[0].trip_count });
        } catch (err) {
        console.error("Error fetching trip count:", err);
        return res.status(500).json({ error: "Internal Server Error" });
        }
    };

//will fetch the longest trip a user has made
export const getLongestTrip = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }
        const trip = await sql`
        SELECT t.trip_name, t.trip_id, COUNT(day_id) AS total_days
        FROM trips AS t
        JOIN days AS d ON t.trips_id = d.trip_id
        WHERE t.user_id = ${userID}
        GROUP BY t.trips_id, t.trip_name
        ORDER BY total_days DESC
        LIMIT 1;   
        `;   
        return res.status(200).json(trip[0]);
        }catch (err) {
            console.error("Error fetching longest trip:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    };