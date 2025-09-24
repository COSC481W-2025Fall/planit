import { sql } from "../config/db.js";

// middleware to load a trip owned by the logged-in user
export async function loadOwnedTrip(req, res, next) {
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
      FROM trips
      WHERE trips_id = ${tripId} AND user_id = ${req.user.user_id}
    `;

    if (trips.length === 0) {
      return res
        .status(404)
        .json({ error: "Trip not found or access denied" });
    }

    req.trip = trips[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}