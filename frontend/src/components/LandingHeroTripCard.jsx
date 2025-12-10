import React from "react";
import { MapPin, Calendar, Heart } from "lucide-react";
import "../css/LandingHeroCards.css";

export default function LandingHeroTripCard({title, location, date, likes, image, selected, onClick}) {
    return (
        <div
            className={`landing-trip-card ${selected ? "selected" : ""}`}
            onClick={onClick}
        >
            <div className="landing-trip-card-image">
                {image ? (
                    <img src={image} alt={title} />
                ) : (
                    <div className="no-image-placeholder" />
                )}
            </div>

            <div className="landing-trip-card-content">
                <h3 className="landing-trip-card-title">{title}</h3>

                <div className="landing-trip-card-footer">
                    <span className="location">
                        <MapPin size={12} />
                        {location}
                    </span>
                    <span className="date">
                        <Calendar size={12} />
                        {date}
                    </span>
                </div>

                <div className="landing-trip-card-likes">
                    <Heart size={14} fill="currentColor" />
                    {likes}
                </div>
            </div>
        </div>
    );
}
