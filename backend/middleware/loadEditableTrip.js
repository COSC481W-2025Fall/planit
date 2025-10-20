import { sql } from "../config/db.js";

// Middleware to load editable trip data
export async function loadEditableTrip(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid trip ID" });
  }

  try {
    const trips = await sql`
      SELECT *
      FROM shared
      WHERE trips_id = ${tripId} AND user_id = ${req.user.user_id}
    `;

  }

  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}