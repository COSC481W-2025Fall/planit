import React, {useState, useEffect, useRef} from "react";
import "../css/ActivityCard.css";
import {Clock, MapPin, EllipsisVertical, Trash2, Pencil, Timer, Globe, NotebookText} from "lucide-react";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import Popup from "./Popup.jsx";

export default function ActivityCard({activity, onDelete, onEdit, onViewNotes}) {
    const [openMenu, setOpenMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const startTime = activity.activity_startTime;

    const formatTime = (timeStr) => {
        if (!timeStr) return "No time";
        const [hours, minutes] = timeStr.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) return timeStr;

        const period = hours >= 12 ? "PM" : "AM";
        const twelveHour = hours % 12 === 0 ? 12 : hours % 12;

        return `${twelveHour}:${minutes.toString().padStart(2, "0")} ${period}`;
    };
    // Toggle three-dot menu
    const toggleMenu = (e) => {
        e.stopPropagation();
        setOpenMenu((prev) => !prev);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            const menuEl = menuRef.current;
            const btnEl = buttonRef.current;
            if (!menuEl || !btnEl) return;
            if (!menuEl.contains(e.target) && !btnEl.contains(e.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDeleteClick = () => {
        setIsDeleting(true);
        setTimeout(() => {
            onDelete(activity.activity_id);
        });
    };


    return (
        <div className={`activity-container ${isDeleting ? "fade-out" : ""}`}>
            <div className="title-notes-edit-button-container" style={{position: "relative"}}>
                <div className="left-side">
                    <div className="title-of-activity">{activity.activity_name}</div>
                </div>

                <button
                    ref={buttonRef}
                    className="ellipsis-btn"
                    type="button"
                    onClick={toggleMenu}
                    aria-haspopup="menu"
                    aria-expanded={openMenu}
                >
                    <EllipsisVertical className="ellipis"/>
                </button>

                {openMenu && (
                    <div ref={menuRef} className="day-menu">
                        <button onClick={handleDeleteClick}>
                            <Trash2 className="trash-icon"/> Delete
                        </button>
                        <button
                            onClick={() => {
                                onEdit(activity);
                                setOpenMenu(false);
                            }}
                        >
                            <Pencil className="pencil-icon"/> Edit
                        </button>
                        <button onClick={() => onViewNotes(activity)}>
                            <NotebookText className="notebook-icon"/> View Notes
                        </button>
                    </div>
                )}
            </div>

            <div className="time-and-location-container">
                <p className="time-of-activity">
                    <Clock className="icon" />
                    {formatTime(startTime)}
                </p>

                <p className="location-of-activity">
                    <MapPin className="icon"/>
                    {activity.activity_address ?? "No address provided"}
                </p>
            </div>

            <p className="duration-of-activity">
                <Timer className="icon"/>
                {activity.activity_duration ? (
                    <>
                        {activity.activity_duration.hours
                            ? `${activity.activity_duration.hours}h`
                            : ""}
                        {activity.activity_duration.hours &&
                        activity.activity_duration.minutes
                            ? " "
                            : ""}
                        {activity.activity_duration.minutes
                            ? `${activity.activity_duration.minutes}m`
                            : ""}
                        {!activity.activity_duration.hours &&
                            !activity.activity_duration.minutes &&
                            "0h:0m"}
                    </>
                ) : (
                    "0h:0m"
                )}
            </p>

            {activity.activity_website ? (
                <div className="website-container">
                    <Globe className="icon"/>
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
                <div className="website-container">&nbsp;</div>
            )}

            <div className="cost-container">
                <p className="estimated-cost-of-activity">
                    {activity.activity_price_estimated != null
                        ? `$${activity.activity_price_estimated}`
                        : "N/A"}
                </p>
            </div>
        </div>
    );
}
