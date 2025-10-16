import { sql } from "../config/db.js";

export const toggleLike = async (req, res) => {
  try {
    const { userId, tripId } = req.body;

    if (!userId || !tripId) {
      return res.status(400).json({ error: "userId and tripId are required" });
    }

    //check if the like already exists
    const existingLike = await sql`
      SELECT like_id FROM likes
      WHERE user_id = ${userId} AND trip_id = ${tripId};
    `;

    if (existingLike.length > 0) {
      // if like exists just remove it
      await sql`
        DELETE FROM likes
        WHERE user_id = ${userId} AND trip_id = ${tripId};
      `;
      return res.status(200).json({ liked: false, message: "Trip unliked" });
    } else {
      const newLike = await sql`
        INSERT INTO likes (user_id, trip_id)
        VALUES (${userId}, ${tripId})
        RETURNING *;
      `;
      return res.status(201).json({ liked: true, message: "Trip liked", like: newLike[0] });
    }

  } catch (err) {
    console.error("Error toggling like:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getAllTripDetailsOfATripLikedByUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const userLikes = await sql`
            SELECT t.trips_id, t.trip_name, t.trip_location, t.trip_start_date, t.trip_updated_at, l.liked_at
            FROM trips AS t
            JOIN likes AS l ON t.trips_id = l.trip_id
            WHERE l.user_id = ${userId}
            ORDER BY l.liked_at DESC
        `;

        return res.status(200).json(userLikes);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getLikedTripIdsByUser = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const likedTrips = await sql`
      SELECT trip_id
      FROM likes
      WHERE user_id = ${userId}
    `;

    const likedTripIds = likedTrips.map(like => like.trip_id);

    return res.status(200).json({ likedTripIds });
  } catch (err) {
    console.error("Error fetching liked trip IDs:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
