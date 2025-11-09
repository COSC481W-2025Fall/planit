/* This controller class contains two functions.
    1. readAllImages: Retrieves all images from the images table.
    2. readOneImage: Retrieves a specific image by its ID from the images table.
*/
import {sql} from "../config/db.js";

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
      imageUrl: row.image_url.replace("/upload/", "/upload/w_150,h_150,c_fill/")
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
      SELECT image_url
      FROM images
      WHERE image_id = ${imageId}
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = result[0];
    res.json(image.image_url);

  } catch (err) {
      console.error("Error retrieving image by ID:", err);
      res.status(500).json({ error: "Internal Server Error" });
  }
};