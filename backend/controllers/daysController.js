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

  const newDayInsertBefore = req.body?.newDayInsertBefore || null;

  // make sure we have a date
  if (!date) {
    return res.status(400).json({ error: "A valid day_date is required." });
  }


  try {
    let newDay;
    if (!newDayInsertBefore){
      const [rows] = await sql.transaction(() => [
        // shift all existing dates forward by 1
        sql`
        UPDATE days
        SET day_date = day_date + INTERVAL '1 day'
        WHERE trip_id = ${tripId} AND day_date >= ${date}
      `,

        // insert new day
        sql`
        INSERT INTO days (trip_id, day_date)
        VALUES (${tripId}, ${date})
        RETURNING day_id, trip_id, day_date
      `
      ]);
      newDay = rows[0];

    } else {
      const [rows] = await sql.transaction(() => [
        // insert new day
        sql`
        INSERT INTO days (trip_id, day_date)
        VALUES (${tripId}, ${date})
        RETURNING day_id, trip_id, day_date
      `
      ]);
      newDay = rows[0];
    }

    res.status(201).json(newDay);

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

  try {
    // get the date from the day we are deleting
    const daysToFetch = await sql`
      SELECT day_date 
      FROM days 
      WHERE day_id = ${dayId} AND trip_id = ${tripId}
    `;

    // Check if the day exists
    if (daysToFetch.length === 0) {
      return res.status(404).json({ error: "Day not found" });
    }

    const deletedDate = daysToFetch[0].day_date;

    if (deletedDate) {
      await sql.transaction(() => [
        sql`
          DELETE FROM days
          WHERE day_id = ${dayId} AND trip_id = ${tripId}
        `,

        sql`
          UPDATE days
          SET day_date = day_date - INTERVAL '1 day'
          WHERE trip_id = ${tripId} AND day_date > ${deletedDate}
        `,
      ]);
    } else {
      await sql`
        DELETE FROM days
        WHERE day_id = ${dayId} AND trip_id = ${tripId}
      `;
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
