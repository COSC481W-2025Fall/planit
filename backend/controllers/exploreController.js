import { sql } from "../config/db.js";

export const getAllTripLocations = async (req, res) => {
    try {
        const locations = await sql`
            SELECT DISTINCT trip_location
            FROM trips
            WHERE is_private = false
        `;

        return res.status(200).json(locations);
    }
    catch (err) {
        console.error("Error fetching trip locations:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getTopLikedTrips = async (req, res) => {
    try {
        const { userId } = req.body;

        // I am grabbing the top 10 liked trips of all time, if you want less than 10 just change the limit clause at the end of the query
        const topLikedTripsAllTime = await sql`
            SELECT t.trips_id, t.trip_name, t.trip_location, t.trip_start_date, t.image_id, t.trip_updated_at,
            COUNT(l.like_id) AS like_count,
            EXISTS ( SELECT 1 FROM likes WHERE likes.trip_id = t.trips_id AND likes.user_id = ${userId}) AS is_liked
            FROM trips AS t
            LEFT JOIN likes AS l ON t.trips_id = l.trip_id
            WHERE t.is_private = false
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

export const getTrendingTrips = async (req, res) => {
    try{
        const { userId } = req.body;
        // grab the top 5 most liked trips in the past week as "trending"

        //WHERE l.liked_at >= date_trunc('week', CURRENT_DATE)
        //only include likes that occurred since the start of the current week (Monday)
          const trendingTrips = await sql`
            SELECT t.trips_id, t.trip_name, t.trip_location, t.trip_start_date, t.image_id, t.trip_updated_at,
            COUNT(l.like_id) AS like_count, 
            EXISTS ( SELECT 1 FROM likes WHERE likes.trip_id = t.trips_id AND likes.user_id = ${userId}) AS is_liked
            FROM trips t
            JOIN likes l ON t.trips_id = l.trip_id
            WHERE l.liked_at >= date_trunc('week', CURRENT_DATE)
            AND t.is_private = false
            GROUP BY t.trips_id
            ORDER BY like_count DESC
            LIMIT 5;
        `;

        return res.status(200).json(trendingTrips);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const searchTrips = async (req, res) => {
    try{
        const { location, userId } = req.body;

          const searchResults = await sql`
            SELECT t.trips_id, t.trip_name, t.trip_location, t.trip_start_date, t.image_id, COUNT(l.like_id) AS like_count, EXISTS ( SELECT 1 FROM likes WHERE likes.trip_id = t.trips_id AND likes.user_id = ${userId}) AS is_liked
            FROM trips t
            LEFT JOIN likes l ON t.trips_id = l.trip_id
            WHERE LOWER(t.trip_location) LIKE LOWER(${`%${location}%`})
            AND t.is_private = false
            GROUP BY t.trips_id
            ORDER BY like_count DESC;
        `;

        return res.status(200).json(searchResults);


    } catch(err){
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}