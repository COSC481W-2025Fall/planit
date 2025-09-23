import { sql } from "../config/db.js";

// middleware to load a trip owned by the logged-in user
export async function loadOwnedTrip(req, res, next) {
    // ensure user is logged in
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // get tripId from URL params and validate
    const tripId = parseInt(req.params.tripId, 10);

    if (isNaN(tripId)) {
        return res.status(400).json({ error: "Invalid trip ID" });
    }   

    // query the database for the trip owned by the user
    try {
        const trips = await sql`
            SELECT *
            FROM trips
            WHERE id = ${tripId} AND user_id = ${req.user.id}
        `;

        // if no trip found, return 404
        if (trips.length === 0) {
            return res.status(404).json({ error: "Trip not found or access denied" });
        }

        // attach the trip to the request object and proceed
        const trip = trips[0];
        req.trip = trip; // Attach the trip to the request object
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    } 
}