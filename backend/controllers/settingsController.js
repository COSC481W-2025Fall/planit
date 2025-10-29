import { sql } from "../config/db.js";

//Endpoints needed
//trips made, longest trip, total likes, cheapest trip
//most expensive trip, and total money spent

//gets total trips made by a single user
export const getTripCount = async (req, res) => {
    try {
        //get userID
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }

        //returns all trips and COUNT will total # of them
        const trip = await sql`
            SELECT COUNT(*) AS trip_count
            FROM trips
            WHERE user_id = ${userID}`;

            //return count in json
            return res.status(200).json({ tripCount: trip[0].trip_count });
        } catch (err) {
        console.error("Error fetching trip count:", err);
        return res.status(500).json({ error: "Internal Server Error" });
        }
    };

//will fetch the longest trip a user has made
export const getLongestTrip = async (req, res) => {
    try {
        //get userID
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }
        //Gets trip id and name of all trips, orders from longest to shortest, limit returns highest
        const trip = await sql`
        SELECT t.trip_name, t.trip_id, COUNT(day_id) AS total_days
        FROM trips AS t
        JOIN days AS d ON t.trips_id = d.trip_id
        WHERE t.user_id = ${userID}
        GROUP BY t.trips_id, t.trip_name
        ORDER BY total_days DESC
        LIMIT 1;   
        `;   
        //returns longest trip in json
        return res.status(200).json(trip[0]);
        }catch (err) {
            console.error("Error fetching longest trip:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    };

    //Gets sum of likes on all trips made by user
export const getTotalLikes = async (req, res) => {
    try {
        //get userID
        const { userID } = req.body;

        if(!userID) {
            return res.status(400).json({error: "userID is required"});
        }
        //selects all likes that belong to the userID taken
        const likes = await sql`
        SELECT COUNT(l.like_id) AS total_likes
        FROM likes AS L
        JOIN trips AS T ON L.trip_id = T.trip_id
        WHERE T.user_id = ${userID};
        `;  
        //returns total likes in json
        return res.status(200).json({ totalLikes: likes[0].total_likes });
    } catch (err) {
        console.error("Error fetching total likes:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getCheapestTrip = async (req, res) => {
    try {
        //get userID
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }
            //Order trips by price_estimate, ascending so we pull cheapest  
                const trip = await sql`
               SELECT trip_name, trip_id
               FROM trips
               WHERE user_id = ${userID}
               ORDER BY (trip_price_estimate) ASC
               LIMIT 1;
                `;
                //returns cheapest trip in json, checks if null in case no trips exist
                return res.status(200).json(trip[0] ?? null);
    } catch (err) {
        console.error("Error fetching cheapest trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMostExpensiveTrip = async (req, res) => {
    try {
        //get userID
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: "userID is required"});
        }
            //Order trips by price_estimate, decending so we pull most expensive 
                const trip = await sql`
                SELECT trip_name, trip_id 
                FROM trips 
                WHERE user_id = ${userID}
                ORDER BY (trip_price_estimate) DESC
                LIMIT 1;
                `;

                //returns most expensive trip in json, checks if null in case no trips exist
                return res.status(200).json(trip[0] ?? null);
    } catch (err) {
        console.error("Error fetching most expensive trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getTotalMoneySpent = async (req, res) => {
    try {
        //get userID
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({error: "userID is required"});
        }
            //gets and sums trip_price)_estimate from all trips of a user
            //COALESCE used to return 0 if no trips or all are NULL for price
            const total = await sql`
            SELECT COALESCE(SUM(trip_price_estimate), 0) AS total_money_spent
            FROM trips 
            WHERE user_id = ${userID}
            `;
    // returns total money spent in json or 0 if no estimated costs are found on any trips
    return res.status(200).json({ totalMoneySpent: total[0].total_money_spent });
    } catch (err) {
        console.error("Error fetching total moneey spent:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
