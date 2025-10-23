/* This controller class contains four functions that handle creating username, modifying all fields in the user table,
and deleting a users account.
For users in the database. This code uses sql`` to interact with the database.
This code uses async/await for asynchronous operations and try/catch for error handling.
*/
//Spooky comment 2
import {sql} from "../config/db.js";

//This function reads the information from multiple trips for a single user.
export const fetchUserTrips = async (req, res) => {
    if (!req.user)
    {
        return res.status(401).json({ loggedIn: false });
    }

    try
    {
        const userId = req.user.user_id;

        // query the database for trips associated with the logged-in user
        const trips = await sql`
      SELECT *
      FROM trips
      WHERE user_id = ${userId}
    `

        res.json({ loggedIn: true, trips: trips });
    }
    catch (err)
    {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

//This function handles the creation of a trip.
export const createTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });

    // Extract all required fields from the request body
    const { tripName, tripStartDate, tripLocation, isPrivate } = req.body;

    // Get userId from the authenticated user in the request
    const userId = req.user.user_id;

    if (userId === undefined) {
        return res.status(400).json({ error: "userId is required, creation unsuccessful" });
    }

    try {
        const result = await sql`
            INSERT INTO trips (trip_name, user_id, trip_start_date, trip_location, is_private)
            VALUES (${tripName}, ${userId}, ${tripStartDate}, ${tripLocation}, ${isPrivate})
                RETURNING *
        `;

        res.json("Trip created.");
    }
    catch (err) {
        console.log("Error creating trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//This function handles the modification of all fields related to a trip.
export const updateTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });
    const { trips_id, tripName, tripStartDate, tripLocation, isPrivate } = req.body;
    const userId = req.user.user_id;

    if (userId  === undefined || trips_id === undefined) {
        return res.status(400).json({ error: "userId and trips_id are required, update unsuccessful" });
    }

    try {
        // Build update fields and values arrays
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (tripName !== undefined) {
            updates.push(`trip_name = $${paramCount}`);
            values.push(tripName);
            paramCount++;
        }
        if (tripStartDate !== undefined) {
            updates.push(`trip_start_date = $${paramCount}`);
            values.push(tripStartDate);
            paramCount++;
        }
        if (tripLocation !== undefined) {
            updates.push(`trip_location = $${paramCount}`);
            values.push(tripLocation);
            paramCount++;
        }

        if(isPrivate !== undefined) {
            updates.push(`is_private = $${paramCount}`);
            values.push(isPrivate);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields to update, update unsuccessful" });
        }

        // Add the WHERE clause parameters for trips_id and userId
        values.push(trips_id);
        values.push(userId);

        const query = `
            UPDATE trips 
            SET ${updates.join(', ')} 
            WHERE trips_id = $${paramCount} 
            AND user_id = $${paramCount + 1}
            RETURNING *
        `;

        await sql.query(query, values);

        const tripExists = await sql`
        SELECT 1 FROM trips WHERE trips_id = ${trips_id}
    `;

        if (tripExists.length === 0) {
            return res.status(404).json({ error: "Trip not found, update unsuccessful" });
        }

        res.json("Trip updated.");
    }
    catch (err) {
        console.log("Error updating trip: " + err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//This function reads the information in the trips table for a specific trip.
export const readTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });

    try {
        const trips_id = req.params.tripId;

        const result = await sql`
            SELECT *
            FROM trips
            WHERE trips_id = ${trips_id} AND user_id = ${req.user.user_id}
        `;

        if (result.length === 0){
            return res.status(404).json({ error: "Trip not found, read unsuccessful" });
        }

        res.json(result[0]);
    }
    catch (err) {
        console.error("Error reading trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//This function handles the complete deletion of a trip.
// Does not allow deletion of trip if user does not own it.
export const deleteTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });
    const { trips_id } = req.body;
    const userId = req.user.user_id;

    if (userId === undefined) {
        return res.status(400).json({ error: "userId is required, delete unsuccessful" });
    }

    try {
        const result = await sql`
            DELETE FROM trips
            WHERE trips_id = ${trips_id} AND user_id = ${userId}
                RETURNING *
        `;

        if (result.length === 0)
        {
            return res.status(404).json({ error: "Trip not found, delete unsuccessful" });
        }

        res.json("Trip deleted.");
    }
    catch (err) {
        console.error("Error deleting trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};