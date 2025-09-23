// backend/controllers/daysController.js
import { sql } from "../config/db.js";

// constants and helper functions to validate input
const toInt = (x) => Number.parseInt(x, 10);
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

// read all days for a specific trip
export const readDays = async (req, res) => {
    // trip is loaded by loadOwnedTrip middleware
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }

    // get tripId from loaded trip
    const tripId = req.trip.id;

    // fetch days from database
    try {
        const days = await sql`
            SELECT id, trip_id, date, day_number, created_at, updated_at
            FROM days
            WHERE trip_id = ${tripId}
            ORDER BY day_number ASC, date ASC
        `;
        // return the list of days
        res.json(days);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// create a new day for a specific trip
export const createDay = async (req, res) => {
    // trip is loaded by loadOwnedTrip middleware
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }
    
    // get tripId from loaded trip
    const tripId = req.trip.id;
    // validate input
    const date = String (req.body?.date);
    const dayNumber = toInt(req.body?.day_number);
    if (!isISODate(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (isNaN(dayNumber) || dayNumber <= 0) {
        return res.status(400).json({ error: "day_number must be a positive integer" });
    }

    // insert new day into database
    try {
        const rows = await sql`
            INSERT INTO days (trip_id, date, day_number)
            VALUES (${tripId}, ${date}, ${toInt(dayNumber)})
            RETURNING id, trip_id, date, day_number, created_at, updated_at
        `;
        // return the newly created day
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === "23505") { // unique_violation
            return res.status(409).json({ error: "A day with this date or day_number already exists for the trip" });
        }

        if (err.code === "23503") { // foreign_key_violation
            return res.status(400).json({ error: "Invalid trip_id" });
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// update an existing day for a specific trip
export const updateDay = async (req, res) => {
    // trip is loaded by loadOwnedTrip middleware
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }

    // get tripId from loaded trip
    const tripId = req.trip.id;
    // get dayId from URL params
    const dayId = req.params.id;
    // validate input
    const date = String(req.body?.date);
    const dayNumber = toInt(req.body?.day_number);

    if (!isISODate(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (isNaN(dayNumber) || dayNumber <= 0) {
        return res.status(400).json({ error: "day_number must be a positive integer" });
    }

    // update day in database
    try {
        const rows = await sql`
            UPDATE days
            SET date = ${date}, day_number = ${dayNumber}
            WHERE id = ${dayId} AND trip_id = ${tripId}
            RETURNING id, trip_id, date, day_number, created_at, updated_at
        `;
        if (rows.length === 0) {
            return res.status(404).json({ error: "Day not found" });
        }
        // return the updated day
        res.json(rows[0]);
    } catch (err) {
        if (err.code === "23505") { // unique_violation
            return res.status(409).json({ error: "A day with this date or day_number already exists for the trip" });
        }

        if (err.code === "23503") { // foreign_key_violation
            return res.status(400).json({ error: "Invalid trip_id" });
        }

        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// delete a day for a specific trip
export const deleteDay = async (req, res) => {
    // trip is loaded by loadOwnedTrip middleware
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }

    // get tripId from loaded trip
    const tripId = req.trip.id;
    // get dayId from URL params
    const dayId = req.params.id;
    // delete day from database
    try {
        const result = await sql`
            DELETE FROM days
            WHERE id = ${dayId} AND trip_id = ${tripId}
            RETURNING id
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: "Day not found" });
        }
        // return no content status
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
