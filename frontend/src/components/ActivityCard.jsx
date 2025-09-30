import React, { useState } from "react";
import "../css/ActivityCard.css";
import { Clock, MapPin, EllipsisVertical, Trash2, Pencil } from "lucide-react";

export default function ActivityCard({ activity, onDelete }) {
    const [openMenu, setOpenMenu] = useState(false);
    const startTime = activity.activity_startTime ? new Date(activity.activity_startTime) : null;

    const toggleMenu = () => setOpenMenu(prev => !prev);

    return (
        <div className="activity-container">
            <div className="title-and-edit-button-container" style={{ position: "relative" }}>
                <div className="title-of-activity">{activity.activity_name}</div>
                <EllipsisVertical className="ellipis" onClick={toggleMenu} />
                {openMenu && (
                    <div className="day-menu">
                        <button onClick={() => onDelete(activity.activity_id)}>
                            <Trash2 className="trash-icon" /> Delete
                        </button>
                        <button onClick={() => onEdit(activity.activity_id)}>
                            <Pencil class = "pencil-icon" /> Edit
                        </button>
                    </div>
                )}
            </div>

            <div className="time-and-location-container">
                <p className="time-of-activity">
                    <Clock className="icon" />
                    {startTime
                        ? startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "No time"}
                </p>

                <p className="location-of-activity">
                    <MapPin className="icon" />
                    {activity.activity_address ?? "No address provided"}
                </p>
            </div>

            <p className="duration-of-activity">
                <Clock className="icon" />
                {activity.activity_duration?.hours != null ? `${activity.activity_duration.hours}h` : "?"}
            </p>

            <div className="cost-container">
                <p className="estimated-cost-of-activity">
                    {activity.activity_price_estimated != null ? `$${activity.activity_price_estimated}` : "N/A"}
                </p>
            </div>
        </div>
    );
}
