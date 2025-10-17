import React, { useState } from "react";
import "../css/ActivityCard.css";
import { Clock, MapPin, EllipsisVertical, Trash2, Pencil, Timer, Globe, NotebookText } from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import Popup from "./Popup.jsx";

export default function ActivityCard({ activity, onDelete, onEdit, onViewNotes }) {
    const [openMenu, setOpenMenu] = useState(false);
    const startTime = activity.activity_startTime ? new Date(activity.activity_startTime) : null;

    const toggleMenu = () => setOpenMenu(prev => !prev);

    return (
        <div className="activity-container">
            <div className="title-notes-edit-button-container" style={{ position: "relative" }}>
                <div className="left-side">
                    <div className="title-of-activity">{activity.activity_name}</div>
                </div>
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

            <div className="notes-button" onClick={() => onViewNotes(activity)}>
                <NotebookText className="icon" />
                <span class ="notes-span">Notes</span>
            </div>

            {activity.activity_website ? (
                <div className="website-container">
                    <Globe className="icon" />
                    <a
                        href={activity.activity_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="website-link"
                    >
                        Website
                    </a>
                </div>
            ) : (
                <div className="website-container">
                    &nbsp;
                </div>
            )}


            <div className="cost-container">
                <p className="estimated-cost-of-activity">
                    {activity.activity_price_estimated != null ? `$${activity.activity_price_estimated}` : "N/A"}
                </p>
            </div>
        </div>
    );
}
