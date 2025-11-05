import React, {useState, useEffect} from "react";
import { Heart, MapPin, Calendar } from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";

export default function TripCardPublic({ trip, liked, onToggleLike, onOpen }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageFetched, setImageFetched] = useState(false);

  const onLike = (e) => {
    e.stopPropagation();
    onToggleLike?.(trip.trips_id);
  };

  useEffect(() => {
    const fetchImage = async () => {
      // Don't refetch if the image has already been fetched
      if (imageFetched) return;

      try {
        const res = await fetch(
          `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/image/readone?imageId=${trip.image_id}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch image");

        const data = await res.json();
        setImageUrl(data.imageUrl);
        setImageFetched(true);
      } catch (err) {
        console.error(`Error fetching image for trip ${trip.trips_id}:`, err);
      }
    };

    fetchImage();

  }, [trip, imageFetched]);

  return (
    <div
      className="trip-card public"
      onClick={() => onOpen?.(trip.trips_id)}
      style={{ cursor: "pointer" }}
    >
      <div className="trip-card-image">
        <img
          src={imageUrl}
          alt={trip.trip_name}
          className="trip-card-img"
        />
      </div>

      <div className="trip-card-content">
        <h3 className="trip-card-title">{trip.trip_name}</h3>

        <div className="trip-meta">
          <span
            className="trip-location"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <MapPin size={16} />
            {trip.trip_location}
          </span>

          {trip.trip_start_date && (
            <span
              className="trip-date"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Calendar size={16} />
              {new Date(trip.trip_start_date).toLocaleDateString()}
            </span>
          )}
        </div>

        <div
          className="trip-stats"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <button
            className={`like-button ${liked ? "liked" : ""}`}
            title={liked ? "Unlike" : "Like"}
            onClick={onLike}
            style={{
              position: "static",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              background: "transparent",
              border: "none",
              lineHeight: 0,
              cursor: "pointer",
              width: "auto",         // shrink to icon width
              height: "auto",
              marginLeft: "-2px"     // nudge left to align with MapPin row
            }}
          >
            <Heart size={18} className={`heart-icon ${liked ? "liked" : ""}`} />
          </button>
          <span>{trip.like_count ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
