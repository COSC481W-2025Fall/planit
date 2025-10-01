import React, { useState } from "react";
import "../css/ActivityCard.css";
import { Clock, MapPin, EllipsisVertical, Trash2, Pencil, Timer } from "lucide-react";
import LocalTime from "./LocalTime";

export default function ActivityCard({ activity, onDelete, onEdit }) {
    const [openMenu, setOpenMenu] = useState(false);
    const toggleMenu = () => setOpenMenu(prev => !prev);

    const startRaw = activity?.activity_start_time ?? activity?.activity_startTime ?? null;
    const isTimestamp = typeof startRaw === "string" && (startRaw.includes("T") || /Z$|[+-]\d{2}:\d{2}$/.test(startRaw));

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
                        <button onClick={() => onEdit(activity)}>
                            <Pencil className="pencil-icon" /> Edit
                        </button>
                    </div>
                )}
            </div>

            <div className="time-and-location-container">
                <p className="time-of-activity">
                    <Clock className="icon" />
                    {startRaw ? (
                        isTimestamp ? (
                            // Full timestamp from API (e.g., "2025-10-01T16:00:00Z")
                            <LocalTime variant="timestamp" value={startRaw} />
                        ) : (
                            // Plain time-of-day from API (e.g., "14:30")
                            <LocalTime variant="time" value={String(startRaw)} />
                        )
                    ) : (
                        "No time"
                    )}
                </p>

                <p className="location-of-activity">
                    <MapPin className="icon" />
                    {activity.activity_address ?? "No address provided"}
                </p>
            </div>

            <p className="duration-of-activity">
                <Timer className="icon" />
                {activity.activity_duration ? (
                    <>
                        {activity.activity_duration.hours ? `${activity.activity_duration.hours}h` : ""}
                        {activity.activity_duration.hours && activity.activity_duration.minutes ? " " : ""}
                        {activity.activity_duration.minutes ? `${activity.activity_duration.minutes}m` : ""}
                        {!activity.activity_duration.hours && !activity.activity_duration.minutes ? "0h:0m" : ""}
                    </>
                ) : (
                    "0h:0m"
                )}
            </p>



            <div className="cost-container">
                <p className="estimated-cost-of-activity">
                    {activity.activity_price_estimated != null ? `$${activity.activity_price_estimated}` : "N/A"}
                </p>
            </div>
        </div>
    );
}
