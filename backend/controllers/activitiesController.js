import axios from "axios";
import { sql } from "../config/db.js";
import {io} from "../socket.js";

// Map undefined → null so inserts/updates send proper NULLs to Postgres
const v = (x) => (x === undefined ? null : x);

export const deleteActivity = async (req, res) => {
  //const io = getIO();
  try {
    // Extract activityId from request body
    const { tripId, activityId, dayId } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: "Invalid activityId" });
    }

    // Delete the activity from the database
    await sql`
      DELETE FROM activities WHERE "activity_id" = ${activityId};
    `;
    io.to(`trip_${tripId}`).emit("deletedActivity", dayId);

    res.json({
      message: "Activity deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const addActivity = async (req, res) => {
  try {
    // Get day that we are adding activity to
    const {day, activity} = req.body;

    // Validate required fields
    if (!day || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Variables that store values for new activity we are creating
    const {
      name,
      address,
      type,
      priceLevel,
      rating,
      longitude,
      latitude,
      website,
    } = activity || {};

    // Query for inserting new activity into db (time/cost/duration set via update)
    await sql`
      INSERT INTO activities
        ("day_id",
         "activity_name",
         "activity_types",
         "activity_price_level",
         "activity_address",
         "activity_rating",
         "longitude",
         "latitude",
         "activity_website")
      VALUES
        (${day},
         ${v(name)},
         ${v(type)},
         ${v(priceLevel)},
         ${v(address)},
         ${v(rating)},
         ${v(longitude)},
         ${v(latitude)},
         ${v(website)});
    `;

    // Return the most recently inserted row for this day/name
    const created = await sql`
      SELECT *
      FROM activities
      WHERE "day_id" = ${day}
        AND "activity_name" = ${v(name)}
      ORDER BY "activity_id" DESC
      LIMIT 1;
    `;

    res.json({
      message: "Activity added successfully",
      activity: created[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateActivity = async (req, res) => {
  try {
    // Pull current values of activity we updating
    const { tripId, activityId, activity, create } = req.body;
    const { startTime, duration, estimatedCost, notesForActivity, dayId } = activity || {};

    if (!activityId || !activity) {
      // Error handling if fields for updating activity are empty
      return res.status(400).json({ error: "Missing required fields" });
    }

    const startTs = startTime ? `${startTime}:00` : null;

    // Convert minutes → interval literal (or null)
    const durationInterval =
      duration === "" || duration == null
        ? null
        : `${Number(duration)} minutes`;

    // Query to replace activity values with new ones we took above
    await sql`
      UPDATE activities
      SET "activity_startTime"       = ${startTs},
          "activity_duration"        = ${durationInterval}::interval,
          "activity_price_estimated" = ${estimatedCost ?? null},
          "notes"                    = ${v(notesForActivity)}
      WHERE "activity_id" = ${activityId};
    `;

    // Return the updated row
    const updated = await sql`
      SELECT * FROM activities WHERE "activity_id" = ${activityId};
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({
      message: "Activity updated successfully",
      activity: updated[0],
    });
    io.to(`trip_${tripId}`).emit("updatedActivity", dayId, create);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const readSingleActivity = async (req, res) => {
  try {
    // Grab activity ID of activity we want to read
    const { activityId } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Query to return Activity we want to read
    const returned = await sql`
      SELECT * FROM activities WHERE "activity_id" = ${activityId};
    `;

    if (returned.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({
      message: "activity retrieved successfully",
      activity: returned[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const readAllActivities = async (req, res) => {
  try {
    const { dayId } = req.body;

    if (!dayId) {
      return res.status(400).json({ error: "Missing required dayId" });
    }

    const activities = await sql`
      SELECT * FROM activities WHERE "day_id" = ${dayId};
    `;

    res.json({
      message: "Activities retrieved successfully",
      activities,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const updateNotesForActivity = async (req, res) => {
  try{
    const { tripId, activityId, notes, dayId } = req.body;
    
    if (!activityId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await sql`
      UPDATE activities 
      SET notes = ${v(notes)}
      WHERE activity_id = ${activityId};
    `
    //On backend could possibly send socket.id as well and exclude the user who initiated a change
    io.to(`trip_${tripId}`).emit("noteUpdated", dayId);

    res.status(200).json({ message: "Notes updated successfully" });

  } catch (err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const checkOverlappingTimes = async (req, res) => {
    try {
        const { dayId, proposedStartTime, proposedDuration} = req.body;
        if (!dayId || !proposedStartTime || !proposedDuration) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const proposedStartTs = `${proposedStartTime}:00`;
        const proposedDurationInterval = `${Number(proposedDuration)} minutes`;
        
        const overlappingActivities = await sql`
          SELECT * FROM activities
          WHERE "day_id" = ${dayId}
          AND NOT (
      (
        (extract(epoch FROM ("activity_startTime"::time)) + extract(epoch FROM ("activity_duration"))) <=
        extract(epoch FROM (${proposedStartTs}::time))
      )
        OR
      (
        extract(epoch FROM ("activity_startTime"::time)) >=
        (extract(epoch FROM (${proposedStartTs}::time)) + extract(epoch FROM (${proposedDurationInterval}::interval)))
    )
  );
`;


        return res.status(200).json({ overlappingActivities });
    } catch (err) {
        console.error("Error checking overlapping times:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

//Endpoint checks overlapping times and also takes in ActivityID in request body
//So that it will not flag when editing an activity by the activity itself
export const checkOverlappingTimesForEdit = async (req, res) => {
    try {
        const { dayId, proposedStartTime, proposedDuration, activityId } = req.body;
        if (!dayId || !proposedStartTime || !proposedDuration || !activityId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const proposedStartTs = `${proposedStartTime}:00`;
        const proposedDurationInterval = `${Number(proposedDuration)} minutes`;
        
        const overlappingActivities = await sql`
      SELECT * FROM activities
      WHERE "day_id" = ${dayId}
      AND "activity_id" != ${activityId}
      AND NOT (
    (
      (extract(epoch FROM ("activity_startTime"::time)) + extract(epoch FROM ("activity_duration"))) <=
      extract(epoch FROM (${proposedStartTs}::time))
    )
    OR
    (
      extract(epoch FROM ("activity_startTime"::time)) >=
      (extract(epoch FROM (${proposedStartTs}::time)) + extract(epoch FROM (${proposedDurationInterval}::interval)))
    )
  );
`;


        return res.status(200).json({ overlappingActivities });
    } catch (err) {
        console.error("Error checking overlapping times for edit:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};