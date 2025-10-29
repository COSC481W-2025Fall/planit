// backend/controllers/daysController.js
import { sql } from "../config/db.js";

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
      SELECT day_id, trip_id, day_date
      FROM days
      WHERE trip_id = ${tripId}
      ORDER BY day_date ASC NULLS LAST, day_id ASC
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
    const rows = await sql`
      INSERT INTO days (trip_id, day_date)
      VALUES (${tripId}, ${date})
      RETURNING day_id, trip_id, day_date
    `;

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

  // update day in database
  try {
    const rows = await sql`
      UPDATE days
      SET day_date = ${date}
      WHERE day_id = ${dayId} AND trip_id = ${tripId}
      RETURNING day_id, trip_id, day_date
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

export const reorderDays = async (req, res) => {
      return res.status(200).json({ info: "TESTING" });
};
