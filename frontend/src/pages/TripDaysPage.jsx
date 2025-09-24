import React from "react";
import { MapPin, Calendar, EllipsisVertical, Trash2, Pencil} from "lucide-react";
import "../css/TripDaysPage.css";
import "../css/Popup.css"; 
import Popup from "../pages/Popup";


const days = [
    { id: 1, date: new Date("2025-10-01"), activities: [] },
    { id: 2, date: new Date("2025-10-02"), activities: [] },
    { id: 3, date: new Date("2025-10-03"), activities: [] },
    { id: 4, date: new Date("2025-10-01"), activities: [] },
    { id: 5, date: new Date("2025-10-02"), activities: [] },
];

const trip = { id: 1, location: "Paris, France", title: "Trip to Paris" };

export default function TripDaysPage() {
    const [openMenu, setOpenMenu] = React.useState(null);
    const [editDay, setEditDay] = React.useState(null);
    const [newDay, setOpenNewDay] = React.useState(null);

    const toggleMenu = (dayId) => {
        setOpenMenu(openMenu === dayId ? null : dayId);
    };

    return (
        <div className="TripDaysPage">
            <h1 className="trip-title">{trip.title}</h1>

            <div className="trip-info">
                <div className="trip-location">
                    <MapPin className="trip-info-icon" />
                    <p className="trip-location-text">{trip.location}</p>
                </div>

                <div className="trip-dates">
                    <Calendar className="trip-info-icon" />
                    <p className="trip-dates-text">
                        {days[0].date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                        {" "}-{" "}
                        {days[days.length - 1].date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                </div>
            </div>

            <img
                className="image-banner"
                src="https://www.earthtrekkers.com/wp-content/uploads/2023/11/Paris-Header-Photo.jpg.optimal.jpg"
            />

            <div className="button-level-bar">
                <h1 className="itinerary-text">Itinerary</h1>
                <button onClick={() => setOpenNewDay(true)} id="new-day-button">+ New Day</button>
            </div>

            <div className="days-container">
                {days.map((day, index) => (
                    <div key={day.id} className="day-card">
                        <div className="top-of-day-card">
                            <p className="day-title">Day {index + 1}</p>
                            <p className="day-name">{day.name}</p>
                        </div>
                        <p className="day-date">
                            {day.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", })}
                        </p>

                        <div className="number-of-activities">
                            <p>{day.activities.length} Activities</p>
                        </div>

                        {day.activities.length === 0 ? (
                            <p className="add-activity-blurb">
                                No activities planned. Add an activity from the sidebar
                            </p>
                        ) : (
                            <div className="activities"></div>
                        )}

                        <div className="day-actions">
                            <EllipsisVertical
                                className="day-actions-ellipsis"
                                onClick={() => toggleMenu(day.id)}
                            />
                            {openMenu === day.id && (
                                <div className="day-menu">
                                    <button onClick={() => setEditDay(day)}>
                                        <Pencil className="pencil-icon" />
                                        <p>Edit</p>
                                    </button>
                                    <button>
                                        <Trash2 className="trash-icon" />
                                        <p>Delete</p>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {editDay && (
                <Popup
                    title={`Day ${days.indexOf(editDay) + 1}`}
                    buttons={
                        <>
                            <button type="button" onClick={() => setEditDay(null)}>Cancel</button>
                            <button type="button" onClick={() => setEditDay(null)}>Save</button>
                        </>
                    }
                >
                    <label className="popup-input">
                        <span>Date:</span>
                        <input type="date" />
                    </label>
                </Popup>
            )}
            {newDay && (
                <Popup title="New Day"
                    buttons={
                        <>
                            <button type="button" onClick={() => setOpenNewDay(null)}>Cancel</button>
                            <button type="button" onClick={() => setOpenNewDay(null)}>+ Add</button>
                        </>
                    }
                >
                    <p className="popup-body-text">Do you want to add a new day to {trip.title}?</p>
                </Popup>
            )}
        </div>
    );
}