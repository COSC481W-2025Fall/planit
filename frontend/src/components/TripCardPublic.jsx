import React from "react";
import { Heart, MapPin, Calendar } from "lucide-react";

export default function TripCardPublic({ trip, liked, onToggleLike, onOpen }) {
  const onLike = (e) => {
    e.stopPropagation();
    onToggleLike?.(trip.trips_id);
  };

  return (
    <div
      className="trip-card public"
      onClick={() => onOpen?.(trip.trips_id)}
      style={{ cursor: "pointer" }}
    >
      <div className="trip-card-image" />

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
