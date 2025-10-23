import { sql } from "../config/db.js";

// Middleware to load editable trip data
export async function loadEditableTrip(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.user_id;
  const tripIdRaw = req.params.tripId ?? req.query.tripId ?? req.body.tripId;
  const tripId = Number(tripIdRaw);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid trip ID" });
  }

  try {
    const trips = await sql`
      SELECT *
      FROM trips t
      WHERE trips_id = ${tripId}
        AND (
        t.user_id = ${userId}
        OR EXISTS (
          SELECT 1
          FROM shared s
          WHERE s.trip_id = t.trips_id
            AND s.user_id = ${userId}
       )
  )
       LIMIT 1
    `;

    if (trips.length === 0) {
      return res
        .status(404)
        .json({ error: "Trip not found or access denied" });
    }

    req.trip = trips[0];
    req.tripPermission = trips[0].user_id === userId ? "owner" : "shared";
    next();
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}