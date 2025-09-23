import {sql} from "../config/db.js";
import axios from "axios";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
export const findPlaces = async (req, res) => 
  {
    try 
    {
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
    catch(err) 
    {
        console.error(err);
        res.status(500).json({ error: err.message });
    }

};