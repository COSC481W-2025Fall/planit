import { sql } from "../config/db.js";

function parseTripId(req) {
    const tripIdRaw = req.params.tripId ?? req.query.tripId ?? req.body.tripId;
    const tripId = Number(tripIdRaw);
    return isNaN(tripId) ? null : tripId;
}

export async function getTripAndAccess(userId, tripId) {
    if (!Number.isInteger(tripId)) {
        throw new Error("Invalid trip ID");
    }
    if (!Number.isInteger(userId)) {
        throw new Error("Invalid user ID");
    }

    const rows = await sql`
        SELECT t.*,
                CASE
                    WHEN t.user_id = ${userId} THEN 'owner'
                    WHEN EXISTS (
                        SELECT 1
                        FROM shared s
                        WHERE s.trip_id = t.trips_id
                          AND s.user_id = ${userId}
                    ) THEN 'editor'
                    ELSE 'viewer'
                END AS permission
        FROM trips t
        WHERE t.trips_id = ${tripId}
        LIMIT 1
    `;

    if (rows.length === 0) {
        return { trip: null, permission: "none" };
    }
    
    const trip = rows[0];
    return { trip, permission: trip.permission };
}