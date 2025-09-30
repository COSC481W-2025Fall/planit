import axios from "axios";
import {sql} from "../config/db.js";


export const deleteActivity = async (req, res) => 
  {
      try 
          {
        // Extract activityId from request body
    const { activityId } = req.body;

    if (!activityId)
        {
        return res.status(400).json({ error: "Invalid activityId" });
        }

        // Validate required fields
    if (!activityId) 
        {
      return res.status(400).json({ error: "Missing required fields" });
        }

        // Delete the activity from the database
    await sql`
      DELETE FROM activities WHERE id = ${activityId};
    `;

    res.json(
    {
      message: "Activity deleted successfully",
    });
  } catch (err) 
    {
    console.error(err);
    res.status(500).json({ error: err.message });
    }
  };

export const addActivity = async (req, res) => 
  {
  try 
  {
    //Get day that we are adding activity to 
    const { day, activity } = req.body;
    //Variables that store values for new we are creating
    const { name, address, type, priceLevel, rating, longitude, latitude, startTime, duration, estimatedCost } = activity;

    if (!day || !activity) 
    {
      //Error handling if fields missing
      return res.status(400).json({ error: "Missing required fields" });
    }

    //Query for inserting new activity into db and values of each field in table
    const newActivity = await sql`
      INSERT INTO activities (day_id, activity_name, activity_types, activity_price_level, activity_address, activity_rating, longitude, latitude, activity_startTime, activity_duration, activity_price_estimated)
      VALUES(${day}, ${name}, ${type}, ${priceLevel}, ${address}, ${rating}, ${longitude}, ${latitude}, ${startTime}, ${duration} , ${estimatedCost})
      RETURNING *;
    `;

    res.json(
    {
      message: "Activity added successfully",
      activity: newActivity[0],
    });
  } catch (err) 
  {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const updateActivity = async (req, res) => {
  try {
    //Pull current values of activity we updating
    const { activityId, activity } = req.body;
    //Variables to store fields we want to edit in activity
    const { startTime, duration, estimatedCost} = activity || {};

    if (!activityId || !activity) {
      //Error handling if fields for updating activity are empty
      return res.status(400).json({ error: "Missing required fields" });
    }

    //Query to replace activity values with new ones we took above
    const updated = await sql`
      UPDATE activities
      SET activity_startTime = ${startTime},
          activity_duration = ${duration},
          activity_price_estimated = ${estimatedCost}
      WHERE id = ${activityId}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({
      message: "Activity updated successfully",
      activity: updated[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const readSingleActivity = async (req, res) => {
  try {
    //Grab activity ID of activity we want to read
    const { activityId } = req.body;

    if (!activityId || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    //Query to return Activity we want to read
    const returned = await sql`
      SELECT * FROM activities WHERE id = ${activityId};
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
}


export const readAllActivities = async (req, res) => {
  try {
    const { dayId } = req.body; 

    if (!dayId) {
      return res.status(400).json({ error: "Missing required dayId" });
    }

    const activities = await sql`
      SELECT * FROM activities WHERE day_id = ${dayId};
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