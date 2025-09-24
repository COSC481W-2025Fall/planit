// backend/controllers/daysController.js
import { sql } from "../config/db.js";

// constants and helper functions to validate input
const toInt = (x) => Number.parseInt(x, 10);

// read all days for a specific trip
export const readDays = async (req, res) => {
    // trip is loaded by loadOwnedTrip middleware
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }

    // get tripId from loaded trip
    const tripId = req.trip.trips_id;

    // fetch days from database
    try {
        const days = await sql`
            SELECT day_id, trip_id, day_date, day_number
            FROM days
            WHERE trip_id = ${tripId}
            ORDER BY day_number ASC, day_date ASC NULLS LAST
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
    const tripId = req.trip.trips_id;
    // validate input
    const date = req.body?.day_date || null;

    try {
    // find current max day_number for this trip
    const [{ max }] = await sql`
      SELECT COALESCE(MAX(day_number), 0) as max
      FROM days
      WHERE trip_id = ${tripId}
    `;
    const nextDayNumber = Number(max) + 1;

    // insert new day into database
    const rows = await sql`
        INSERT INTO days (trip_id, day_date, day_number)
        VALUES (${tripId}, ${date}, ${nextDayNumber})
        RETURNING trip_id, day_id, day_number, day_date
    `;
        // return the newly created day
        res.status(201).json(rows[0]);
    } catch (err) {
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
    const tripId = req.trip.trips_id;
    // get dayId from URL params
    const dayId = req.params.id;
    // validate input
    const date = req.body?.day_date ?? null;
  const hasDayNumber = Object.prototype.hasOwnProperty.call(req.body, "day_number");
  const parsedDayNumber = hasDayNumber ? Number.parseInt(req.body.day_number, 10) : null;
  if (hasDayNumber && (Number.isNaN(parsedDayNumber) || parsedDayNumber <= 0)) {
    return res.status(400).json({ error: "day_number must be a positive integer" });
  }

    // update day in database
    try {
        const rows = await sql`
            UPDATE days
            SET day_date = ${date}, day_number = COALESCE(${parsedDayNumber}, day_number)
            WHERE day_id = ${dayId} AND trip_id = ${tripId}
            RETURNING day_id, trip_id, day_number, day_date
        `;
        if (rows.length === 0) {
            return res.status(404).json({ error: "Day not found" });
        }
        // return the updated day
        res.json(rows[0]);
    } catch (err) {
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
    const tripId = req.trip.trips_id;
    // get dayId from URL params
    const dayId = req.params.id;
    // delete day from database
    try {
        const result = await sql`
            DELETE FROM days
            WHERE day_id = ${dayId} AND trip_id = ${tripId}
            RETURNING day_id
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
