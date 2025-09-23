import { sql } from "../config/db.js";

const toInt = (x) => Number.parseInt(x, 10);
const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

export const readDays = async (req, res) => {
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }

    const tripId = req.trip.id;

    try {
        const days = await sql`
            SELECT id, trip_id, date, day_number, created_at, updated_at
            FROM days
            WHERE trip_id = ${tripId}
            ORDER BY day_number ASC, date ASC
        `;
        res.json(days);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createDay = async (req, res) => {
    if (!req.trip) {
        return res.status(400).json({ error: "Trip ID is required" });
    }
    
    const tripId = req.trip.id;
    const date = String (req.body?.date);
    const dayNumber = toInt(req.body?.day_number);
    if (!isISODate(date)) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }

    if (isNaN(dayNumber) || dayNumber <= 0) {
        return res.status(400).json({ error: "day_number must be a positive integer" });
    }

    try {
        const rows = await sql`
            INSERT INTO days (trip_id, date, day_number)
            VALUES (${tripId}, ${date}, ${toInt(dayNumber)})
            RETURNING id, trip_id, date, day_number, created_at, updated_at
        `;
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
