import {sql} from "../config/db.js";
import axios from "axios";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const findCityAutocomplete = async (req, res) => {
  try {

    // in the activity bar component, we send a json attribute of 'query' 
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query must not be empty" });
    }

    const url = "https://places.googleapis.com/v1/places:autocomplete";

    const { data } = await axios.post(
      url,
      {
        input: query,
        includedPrimaryTypes: ["(cities)"],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
        },
      }
    );

    res.json({ result: data });
  } catch (err) {
    console.error("City autocomplete error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
};


export const findPlaces = async (req, res) => 
  {
    try 
    {
        const { query } = req.body;

        const url = "https://places.googleapis.com/v1/places:searchText";

        const {data} = await axios.post(url, 
            {
                textQuery: query,

                // I set the results to 20, can change if needed
                pageSize: 20,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "places.id,places.displayName,places.primaryType,places.priceLevel,places.addressComponents,places.rating,places.location,places.websiteUri",
                },
            }
        );

        res.json({ results: data.places || [] });
    }
    catch(err) 
    {
        console.error(err);
        res.status(500).json({ error: err.message });
    }

};