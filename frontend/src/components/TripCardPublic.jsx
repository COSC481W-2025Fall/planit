import React from "react";
import { Heart, ThumbsUp, MapPin, Calendar } from "lucide-react";

export default function TripCardPublic({ trip, liked, onToggleLike, onOpen }) {
  return (
    <div
      className="trip-card public"
      onClick={() => onOpen?.(trip.trips_id)}
      style={{ cursor: "pointer" }}
    >
      <div className="trip-card-image" />

      {/* Icon-only like button (heart only; no circular outline/fill) */}
      <button
        className={`like-button ${liked ? "liked" : ""}`}
        title={liked ? "Unlike" : "Like"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike(trip.trips_id);
        }}
      >
        <Heart size={18} className={`heart-icon ${liked ? "liked" : ""}`} />
      </button>

      <div className="trip-card-content">
        <h3 className="trip-card-title">{trip.trip_name}</h3>

        <div className="trip-meta">
          <span className="trip-location" style={{ display: "inline-flex", alignItems: "center" }}>
            <MapPin size={16} />
            {trip.trip_location}
          </span>

          {trip.trip_start_date && (
            <span className="trip-date" style={{ display: "inline-flex", alignItems: "center" }}>
              <Calendar size={16} />
              {new Date(trip.trip_start_date).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="trip-stats">
          <ThumbsUp size={16} />
          {trip.like_count ?? 0}
        </div>
      </div>
    </div>
  );
}
