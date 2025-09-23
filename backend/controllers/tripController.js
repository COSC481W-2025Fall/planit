/* This controller class contains four functions that handle creating username, modifying all fields in the user table,
and deleting a users account.
For users in the database. This code uses sql`` to interact with the database.
This code uses async/await for asynchronous operations and try/catch for error handling.
*/
import {sql} from "../config/db.js";

//This function handles the creation of a trip.
export const createTrip = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ loggedIn: false });

        // Extract all required fields from the request body
        const { days, tripName, tripStartDate, tripEndDate, tripLocation } = req.body;

        // Get userId from the authenticated user in the request
        const userId = req.user.user_id;

        if (!userId === undefined) {
            return res.status(400).json({ error: "userId is required" });
        }

        const result = await sql`
            INSERT INTO trips (days, trip_name, user_id, trip_start_date, trip_end_date, trip_location)
            VALUES (${days}, ${tripName}, ${userId}, ${tripStartDate}, ${tripEndDate}, ${tripLocation})
                RETURNING *
        `;

        res.json("Trip created successfully");
    }
    catch (err) {
        console.log("Error creating trip:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//This function handles the modification of the four desired fields in the user table.
// export const modifyUser = async (req, res) => {
//     try {
//         const { userId, field, value } = req.body;
//
//         if (!userId || !field || value === undefined) {
//             return res.status(400).json({ error: "userId, field, and value are required" });
//         }
//
//         // Use switch statement to form SQL statement dependent on field variable.
//         let result;
//         switch (field) {
//             case "first_name":
//                 result = await sql`
//           UPDATE users
//           SET first_name = ${value}
//           WHERE user_id = ${userId}
//           RETURNING *
//         `;
//                 break;
//
//             case "last_name":
//                 result = await sql`
//           UPDATE users
//           SET last_name = ${value}
//           WHERE user_id = ${userId}
//           RETURNING *
//         `;
//                 break;
//
//             case "username":
//                 result = await sql`
//           UPDATE users
//           SET username = ${value}
//           WHERE user_id = ${userId}
//           RETURNING *
//         `;
//                 break;
//
//             case "email":
//                 result = await sql`
//           UPDATE users
//           SET email = ${value}
//           WHERE user_id = ${userId}
//           RETURNING *
//         `;
//                 break;
//
//             default:
//                 return res.status(400).json({ error: "Invalid field" });
//         }
//     }
//     catch (err) {
//         console.log(err);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// };


//This function reads the information in the trips table for a specific trip.
export const readTrip = async (req, res) => {
    if (!req.user) return res.status(401).json({ loggedIn: false });

    try {
        const tripId = req.params.tripId;

        const result = await sql`
    SELECT *
    FROM trips
    WHERE trips_id = ${tripId}
    `;

        if (result.length === 0)
            return res.status(404).json({ error: "Trip not found" });

        res.json(result[0]);
    }
    catch (err) {
        console.error("Error reading trip:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// //This function handles the complete deletion of a user.
// export const deleteUser = async (req, res) => {
//     if (!req.user) return res.status(401).json({ loggedIn: false });
//
//     try {
//         const userId = req.user.user_id;
//
//         const result = await sql`
//     DELETE FROM users
//     WHERE user_id = ${userId}
//     RETURNING *
//     `;
//
//         if (result.length === 0)
//             return res.status(404).json({ error: "User not found" });
//
//         res.json({ loggedIn: false, message: "User deleted" });
//     }
//     catch (err) {
//         console.error("Error deleting user:", err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };