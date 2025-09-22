import axios from "axios";
import {sql} from "../config/db.js";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// export const getNumberOfDays = async (req, res) => {
//   try {
//     const { tripId } = req.query;

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

export const addActivity = async (req, res) => {
  try {
    const { day, activity } = req.body;
    const { name, address, type, priceLevel, rating, longitude, latitude } = activity;

    if (!day || !activity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newActivity = await sql`
      INSERT INTO activities (day_id, activity_name, activity_types, activity_price_level, activity_address, activity_rating, longitude, latitude)
      VALUES(${day}, ${name}, ${type}, ${priceLevel}, ${address}, ${rating}, ${longitude}, ${latitude})
      RETURNING *;
    `;

    res.json({
      message: "Activity added successfully",
      activity: newActivity[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


export const searchPlaces = async (req, res) => {
    try {
        const { query } = req.body;

        const url = "https://places.googleapis.com/v1/places:searchText";

        const {data} = await axios.post(url, 
            {
                textQuery: query,
                pageSize: 20,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "places.id,places.displayName,places.primaryType,places.priceLevel,places.addressComponents,places.photos,places.rating,places.location,places.websiteUri",
                },
            }
        );

        res.json({ results: data.places || [] });
    }
    catch(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }

};


