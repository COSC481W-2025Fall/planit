import { act } from "react";
import { sql } from "../config/db.js";

export async function getCloneData(req, res) {
    const tripId = Number(req.params.tripId);

    try {
        const tripRows = await sql`
            SELECT trips_id, trip_start_date, user_id
            FROM trips
            WHERE trips_id = ${tripId}
            LIMIT 1
        `;

        if (tripRows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        const dayCountRows = await sql`
            SELECT COUNT(*)
            FROM days
            WHERE trip_id = ${tripId}
        `;

        return res.json({
            dayCount: Number(dayCountRows[0].count)
        });
    } catch (error) {
        console.error("Error fetching clone data:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function cloneTrip(req, res) {
    const userId = req.user.user_id;
    const tripId = Number(req.params.tripId);
    let { newStartDate, newTripName } = req.body;
    if (!newStartDate) {
        return res.status(400).json({ error: "New start date is required" });
    }

    try {
        const tripRows = await sql`
            SELECT *
            FROM trips
            WHERE trips_id = ${tripId}
            LIMIT 1
        `;
        if (tripRows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }
        const originalTrip = tripRows[0];

        const tripDays = await sql`
            SELECT *
            FROM days
            WHERE trip_id = ${tripId}
            ORDER BY day_date
        `;
        const dayCount = tripDays.length;

        if (!userId || userId.toString().startsWith("guest_")) {
            return res.status(403).json({ error: "Login to clone this trip" });
        }

        const start = new Date(newStartDate);
        const end = new Date(start);
        end.setDate(start.getDate() + dayCount - 1);
        const newEndDate = end.toISOString().slice(0, 10);

        //Load Activities
        const activities = await sql`
                SELECT *
                FROM activities
                WHERE day_id IN (
                    SELECT day_id
                    FROM days
                    WHERE trip_id = ${tripId}
                )
                ORDER BY activity_id
            `;

        //Create new trip
        const newTripRows = await sql`
            INSERT INTO trips (user_id, trip_name, trip_location, trip_start_date, image_id, trip_category)
            VALUES (
                ${userId},
                ${newTripName || originalTrip.trip_name},
                ${originalTrip.trip_location},
                ${newStartDate},
                ${originalTrip.image_id},
                ${originalTrip.trip_category}
            )
            RETURNING trips_id;
            `;
        const newTripId = newTripRows[0].trips_id;

        //Create new days
        const dayIdMap = new Map();
        for (let i = 0; i < tripDays.length; i++) {
            const day = tripDays[i];

            const shiftedStart = new Date(start);
            shiftedStart.setDate(shiftedStart.getDate() + i);

            const inserted = await sql`
                    INSERT INTO days (trip_id, day_date)
                    VALUES (
                    ${newTripId},
                    ${shiftedStart.toISOString().slice(0, 10)}
                    )
                    RETURNING day_id;
                `;
            dayIdMap.set(day.day_id, inserted[0].day_id);
        }

        //Create new activities except for notes
        for (const activity of activities) {
            const newDayId = dayIdMap.get(activity.day_id);
            console.log(activity);

            await sql`
                    INSERT INTO activities (
                    "day_id",
                    "activity_name",
                    "activity_types",
                    "activity_rating",
                    "activity_price_estimated",
                    "activity_address",
                    "activity_duration",
                    "activity_startTime",
                    "activity_website",
                    "latitude",
                    "longitude"
                    )
                    VALUES (
                    ${newDayId},
                    ${activity.activity_name},
                    ${activity.activity_types},
                    ${activity.activity_rating},
                    ${activity.activity_price_estimated},
                    ${activity.activity_address},
                    ${activity.activity_duration},
                    ${activity.activity_startTime},
                    ${activity.activity_website},
                    ${activity.latitude},
                    ${activity.longitude}
                    );
                `;
        }

        return res.json({
            ok: true,
            newTripId,
            message: "Trip cloned successfully",
        });
    } catch (error) {
        console.error("Error cloning trip:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}