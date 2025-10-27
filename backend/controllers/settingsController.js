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

    //Gets sum of likes on all trips made by user
export const getTotalLikes = async (req, res) => {
    try {
        const { userID } = req.body;

        if(!userID) {
            return res.status(400).json({error: "userID is required"});
        }

        const likes = await sql`
        SELECT COUNT(l.like_id) AS total_likes
        FROM likes AS L
        JOIN trips AS T ON L.trip_id = T.trip_id
        WHERE T.user_id = ${userID};
        `;  

        return res.status(200).json({ totalLikes: likes[0].total_likes });
    } catch (err) {
        console.error("Error fetching total likes:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getCheapestTrip = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }
        
                const trip = await sql`
                SELECT * FROM (
                    SELECT
                        t.trips_id,
                        t.trip_name,
                        COUNT(a.activity_id) AS total_activities,
                        COUNT(a.activity_price_estimated) FILTER (WHERE a.activity_price_estimated IS NOT NULL) AS estimated_count,
                        SUM(a.activity_price_estimated) FILTER (WHERE a.activity_price_estimated IS NOT NULL) AS estimated_total
                    FROM trips t
                    LEFT JOIN days d ON d.trip_id = t.trips_id
                    LEFT JOIN activities a ON a.day_id = d.day_id
                    WHERE t.user_id = ${userID}
                    GROUP BY t.trips_id, t.trip_name
                ) q
                ORDER BY (q.estimated_total IS NULL), q.estimated_total ASC
                LIMIT 1;
                `;

                return res.status(200).json(trip[0] ?? null);
    } catch (err) {
        console.error("Error fetching cheapest trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMostExpensiveTrip = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }
        
                const trip = await sql`
                SELECT * FROM (
                    SELECT
                        t.trips_id,
                        t.trip_name,
                        COUNT(a.activity_id) AS total_activities,
                        COUNT(a.activity_price_estimated) FILTER (WHERE a.activity_price_estimated IS NOT NULL) AS estimated_count,
                        SUM(a.activity_price_estimated) FILTER (WHERE a.activity_price_estimated IS NOT NULL) AS estimated_total
                    FROM trips t
                    LEFT JOIN days d ON d.trip_id = t.trips_id
                    LEFT JOIN activities a ON a.day_id = d.day_id
                    WHERE t.user_id = ${userID}
                    GROUP BY t.trips_id, t.trip_name
                ) q
                ORDER BY (q.estimated_total IS NULL), q.estimated_total DESC
                LIMIT 1;
                `;

                return res.status(200).json(trip[0] ?? null);
    } catch (err) {
        console.error("Error fetching most expensive trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getTotalMoneySpent = async (req, res) => {
    try {
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({error: "userID is required"});
        }

        const total = await sql`
        SELECT SUM(a.activity_price_esimated) AS total_money_spent
        FROM trips t
        JOIN days d ON d.day_id = t.trips_id
        JOIN activities a ON a.day_id = d.day_id
        WHERE t.user_id = ${userID}; 
        `;  
        return res.status(200).json({ totalMoneySpent: total[0].total_money_spent ?? 0 });
    } catch (err) {
        console.error("Error fetching total moneey spent:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
