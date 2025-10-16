/* This controller class contains four functions that handle creating username, updating all fields in the user table,
and deleting a users account.
*/
import {sql} from "../config/db.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//This function retrieves all images from the images table.
export const readAllImages = async (req, res) => {
  try {
    const result = await sql`
      SELECT *
      FROM images
    `;

    const images = result.map((row) => ({
        image_id: row.image_id,
        image_name: row.image_name,
        imageUrl: cloudinary.url(row.public_id, {
            secure: true,
            transformation: [{ width: 200, height: 200, crop: "fill" }],
        }),
    }));

    res.json(images);
  } catch (err) {
        console.error("Error reading all images:", err);
        res.status(500).json({ error: "Internal Server Error" });
  }
};

//This function populates trips table fk attribute image_id with a given imageId.
export const assignImageToTrip = async (req, res) => {
    try {
        const {tripId, imageId} = req.body;
        const result = await sql`
            UPDATE trips
            SET image_id = ${imageId}
            WHERE trip_id = ${tripId}
            RETURNING *
        `;
        if (result.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }
        return res.json("Image assigned to trip successfully");
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// This function retrieves a specific image by its ID from the images table.
export const getImageById = async (req, res) => {
  try {
    const { imageId } = req.params;
    const result = await sql`
      SELECT * FROM images
      WHERE image_id = ${imageId}
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }
    return res.json(result[0]);
  }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
  }
};