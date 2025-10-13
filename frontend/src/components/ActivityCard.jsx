import React, { useState, useEffect, useRef } from "react";
import "../css/ActivityCard.css";
import { Clock, MapPin, EllipsisVertical, Trash2, Pencil, Timer } from "lucide-react";

export default function ActivityCard({ activity, onDelete, onEdit }) {
    const [openMenu, setOpenMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // 👈 new state
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const startTime = activity.activity_startTime ? new Date(activity.activity_startTime) : null;

    const toggleMenu = (e) => {
        e.stopPropagation();
        setOpenMenu((prev) => !prev);
    };

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
            onDelete(); // call parent delete after animation
        }, 250); // must match CSS transition
    };

    return (
        <div className={`activity-container ${isDeleting ? "fade-out" : ""}`}>
            <div className="title-and-edit-button-container" style={{ position: "relative" }}>
                <div className="title-of-activity">{activity.activity_name}</div>

                <button
                    ref={buttonRef}
                    className="ellipsis-btn"
                    type="button"
                    onClick={toggleMenu}
                    aria-haspopup="menu"
                    aria-expanded={openMenu}
                >
                    <EllipsisVertical className="ellipis" />
                </button>

                {openMenu && (
                    <div ref={menuRef} className="day-menu">
                        <button onClick={handleDeleteClick}>
                            <Trash2 className="trash-icon" /> Delete
                        </button>
                        <button
                            onClick={() => {
                                onEdit(activity);
                                setOpenMenu(false);
                            }}
                        >
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

            <div className="cost-container">
                <p className="estimated-cost-of-activity">
                    {activity.activity_price_estimated != null ? `$${activity.activity_price_estimated}` : "N/A"}
                </p>
            </div>
        </div>
    );
}

