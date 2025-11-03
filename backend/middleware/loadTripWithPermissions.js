import { sql } from "../config/db.js";

// load a trip and check user permissions
export async function loadTripWithPermissions(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.user_id;
  const tripIdRaw = req.params.tripId ?? req.body.tripId ?? req.query.tripId;
  const tripId = Number(tripIdRaw);

  if (tripIdRaw === undefined || isNaN(tripId)) {
    return res.status(400).json({ error: "Invalid trip ID" });
  }

  try {
    // Get the trip
    const trips = await sql`
      SELECT *
      FROM trips
      WHERE trips_id = ${tripId}
      LIMIT 1
    `;

    if (trips.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const trip = trips[0];

    // Check if user is the owner
    const isOwner = trip.user_id === userId;

    // Check if user has shared access
    const sharedResult = await sql`
      SELECT *
      FROM shared
      WHERE trip_id = ${tripId} AND user_id = ${userId}
    `;

    const hasSharedAccess = sharedResult.length > 0;

    // Determine permission level
    let permission = null;
    if (isOwner) {
      permission = "owner";
    } else if (hasSharedAccess) {
      permission = "participant";
    } else if (!trip.is_private) {
      permission = "viewer";
    }

    // If no permission, deny access
    if (!permission) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Attach trip and permission to request
    req.trip = trip;
    req.tripPermission = permission;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}