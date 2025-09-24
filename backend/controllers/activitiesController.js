import axios from "axios";
import {sql} from "../config/db.js";


export const deleteActivity = async (req, res) => 
  {
  try 
  {
    const { activityId } = req.body;

    if (!activityId)
    {
    return res.status(400).json({ error: "Invalid activityId" });
    }


    if (!activityId) 
    {
      return res.status(400).json({ error: "Missing required fields" });
    }

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
    const { day, activity } = req.body;
    const { name, address, type, priceLevel, rating, longitude, latitude } = activity;

    if (!day || !activity) 
    {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newActivity = await sql`
      INSERT INTO activities (day_id, activity_name, activity_types, activity_price_level, activity_address, activity_rating, longitude, latitude)
      VALUES(${day}, ${name}, ${type}, ${priceLevel}, ${address}, ${rating}, ${longitude}, ${latitude})
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
    const { activityId, activity } = req.body;
    const { name, priceLevel, } = activity || {};

    if (!activityId || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updated = await sql`
      UPDATE activities
      SET activity_name = ${name},
          activity_price_level = ${priceLevel},
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



