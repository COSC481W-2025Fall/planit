import React from "react";
import "../css/ActivityCard.css"

export default function ActivityCard({ activity }) {
    return (
        <div className="activity-container">
            <div className="title-and-edit-button-container">
                <div className="title-of-activity">{activity.activity_name}</div>
                <button className="edit-activity-button"></button>
            </div>

            <div className="time-duration-and-location-container">
                <p className="time-of-activity">
                    {activity.activity_startTime
                        ? new Date(activity.activity_startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "No time"}
                </p>
                <p className="duration-of-activity">{activity.activity_duration ?? "?"}h</p>
                <p className="location-of-activity">{activity.activity_address}</p>
            </div>

            <div className="cost-container">
                <p className="estimated-cost-of-activity">
                    Est. Cost: {activity.activity_price_estimated != null ? `$${activity.activity_price_estimated}` : "N/A"}
                </p>
            </div>
        </div>
    );
}
