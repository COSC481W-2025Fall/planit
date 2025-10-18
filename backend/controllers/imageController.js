/* This controller class contains two functions.
    1. readAllImages: Retrieves all images from the images table.
    2. getImageById: Retrieves a specific image by its ID from the images table.
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

// This function retrieves a specific image by its ID from the images table.
export const readOneImage = async (req, res) => {
  try {
    const { imageId } = req.query;
    const result = await sql`
      SELECT public_id
      FROM images
      WHERE image_id = ${imageId}
    `;
    console.log('SQL result:', result);

    if (result.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = result[0];
    console.log("Retrieved image:", image);
    console.log("Image URL:", cloudinary.url(image.public_id, { secure: true }));
    res.json({ imageUrl: cloudinary.url(image.public_id, { secure: true }) });

  } catch (err) {
      console.error("Error retrieving image by ID:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
};