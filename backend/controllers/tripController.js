/* This controller class contains four functions that handle creating username, modifying all fields in the user table,
and deleting a users account.
For users in the database. This code uses sql`` to interact with the database.
This code uses async/await for asynchronous operations and try/catch for error handling.
*/
import { sql } from "../config/db.js";

//Helper function to generate the dates between a start and end date
export function generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate.replace(/-/g, "/"));
    const lastDate = new Date(endDate.replace(/-/g, "/"));

    while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

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

//This function handles the creation of a trip AND all its associated days
export const createTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });

    // Extract all required fields from the request body
    const { tripName, tripStartDate, tripEndDate, tripLocation, isPrivate, imageid } = req.body;

    // Get userId from the authenticated user in the request
    const userId = req.user.user_id;

    if (userId === undefined) {
        return res.status(400).json({ error: "userId is required, creation unsuccessful" });
    }

    if (!tripStartDate || !tripEndDate) {
        return res.status(400).json({ error: "tripStartDate and tripEndDate are required to create a trip" });
    }

    try {
        const result = await sql`
            INSERT INTO trips (trip_name, user_id, trip_start_date, trip_location, is_private, image_id)
            VALUES (${tripName}, ${userId}, ${tripStartDate}, ${tripLocation}, ${isPrivate}, ${imageid})
                RETURNING *
        `;

        const newTrip = result[0];
        const newTripId = newTrip.trips_id;

        // generate the dates for the days from start and end date
        const dayDates = generateDateRange(tripStartDate, tripEndDate);

        // Build an array of SQL queries to insert days with those dates
        const dayQueries = dayDates.map(
            (date) => sql`
            INSERT INTO days (trip_id, day_date)
            VALUES (${newTripId}, ${date})
            `
        );

        // run all of those queries
        if (dayQueries.length > 0) {
            await sql.transaction(() => dayQueries);
        }

        // return the trip
        res.json(newTrip);

    } catch (err) {
        console.log("Error creating trip or its days:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//This function handles the modification of all fields related to a trip.
export const updateTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });
    const { trips_id, tripName, tripStartDate, tripLocation, isPrivate, imageid } = req.body;
    const userId = req.user.user_id;

    if (userId  === undefined || trips_id === undefined) {
        return res.status(400).json({ error: "userId and trips_id are required, update unsuccessful" });
    }

    try {
        //get the trip_start_date
        const oldTripResult = await sql`SELECT trip_start_date FROM trips WHERE trips_id = ${trips_id} AND user_id = ${userId}`;

        if (oldTripResult.length === 0) {
            return res.status(404).json({ error: "Trip not found, update unsuccessful" });
        }
        
        //convert trip_start_date to a string
        const oldStartDateStr = new Date(oldTripResult[0].trip_start_date)
            .toISOString()
            .split("T")[0];
        const newStartDateStr = tripStartDate;

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

        if (imageid !== undefined) {
            updates.push(`image_id = $${paramCount}`);
            values.push(imageid);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No valid fields were supplied for update." });
        }

        if (updates.length > 0) {
            values.push(trips_id);
            values.push(userId);
            //paramCount++;

            const query = `
                UPDATE trips 
                SET ${updates.join(", ")} 
                WHERE trips_id = $${paramCount} 
                AND user_id = $${paramCount + 1}
                RETURNING *`;
                
            await sql.query(query, values);
        }

        // shift all days if start date is changed
        if (newStartDateStr && newStartDateStr !== oldStartDateStr) {
            // Get all days for this trip
            const days = await sql`
                SELECT day_id, day_date 
                FROM days
                WHERE trip_id = ${trips_id}
                ORDER BY day_date ASC`;

            // if there are no days we don't need to do this
            if (days.length > 0) {
                let currentDate = new Date(newStartDateStr.replace(/-/g, "/"));
                const updateQueries = [];

                for (const day of days) {
                    const newDate = currentDate.toISOString().split("T")[0];
                    // Add query to the list
                    updateQueries.push(sql`
                        UPDATE days
                        SET day_date = ${newDate}
                        WHERE day_id = ${day.day_id} AND trip_id = ${trips_id}
                    `);
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                // Run all day-update queries in a single atomic transaction
                await sql.transaction(() => updateQueries);
            }
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
