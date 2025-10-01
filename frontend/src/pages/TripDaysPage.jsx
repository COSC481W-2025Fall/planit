import React, { useState, useEffect } from "react";
import { MapPin, Calendar, EllipsisVertical, Trash2 } from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import "../css/TripDaysPage.css";
import "../css/Popup.css";
import Popup from "../components/Popup";
import ActivitySearch from "../components/ActivitySearch.jsx";
import NavBar from "../components/NavBar";
import TopBanner from "../components/TopBanner";
import { getDays, createDay, deleteDay } from "../../api/days";
import { useParams } from "react-router-dom";

export default function TripDaysPage() {
    //constants for data
    const [user, setUser] = useState(null);
    const [trip, setTrip] = useState(null);
    const [days, setDays] = useState([]);
    const [deleteDayId, setDeleteDayId] = useState(null);

    //constants for UI components
    const [openMenu, setOpenMenu] = useState(null);
    const [newDay, setOpenNewDay] = useState(null);
    const [openActivitySearch, setOpenActivitySearch] = useState(false);

    const { tripId } = useParams();

    //get the user
    useEffect(() => {
        fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/login/details", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => { if (data.loggedIn !== false) setUser(data); })
            .catch((err) => console.error("User fetch error:", err));
    }, []);

    //get the trip
    useEffect(() => {
        fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + `/trip/read/${tripId}`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => setTrip(data))
            .catch((err) => console.error("Trip fetch error:", err));
    }, []);

    //initial fetch of days
    useEffect(() => {
        fetchDays();
    }, []);

    //get the days for the trip
    const fetchDays = () => {
        if (!tripId) return;

        getDays(tripId)
            .then((data) =>
                setDays(
                    data.map((day) => ({
                        ...day,
                        day_id: day.day_id,
                        day_date: day.day_date,
                    }))
                )
            )
            .catch((err) => console.error("Error fetching days:", err));
    };

    //add a new day
    const handleAddDay = async () => {
        try {
            let nextDate;
            if (days.length > 0) {
                const lastDayDate = new Date(days[days.length - 1].day_date);
                nextDate = new Date(lastDayDate);
                nextDate.setDate(lastDayDate.getDate() + 1);
            } else {
                nextDate = new Date(trip.trip_start_date);
            }

            const formatted = nextDate.toISOString().split("T")[0];
            await createDay(tripId, { day_date: formatted });

            await fetchDays();
            setOpenNewDay(false);
        } catch (err) {
            console.error("Error creating day:", err);
        }
    };

    //delete a day
    const handleDeleteDay = async (dayId) => {
        try {
            if (openMenu === dayId) setOpenMenu(null);
            await deleteDay(tripId, dayId);
            await fetchDays();
        } catch (err) {
            console.error("Error deleting day:", err);
        }
    };

    const toggleMenu = (dayId) => {
        setOpenMenu(openMenu === dayId ? null : dayId);
    };

    // Loading state
    if (!user || !trip) {
        return (
            <div className="page-layout">
                <TopBanner user={user} onSignOut={() => console.log("Signed out")} />
                <div className="content-with-sidebar">
                    <NavBar />
                    <main className="TripDaysPage">
                        <div className="loading-screen">
                            <p>Loading...</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="page-layout">
            <TopBanner user={user} onSignOut={() => { console.log("Signed out"); window.location.href = "/";}}/>

            <div className="content-with-sidebar">
                <NavBar />

                <main className="TripDaysPage">
                    <h1 className="trip-title">{trip.trip_name}</h1>

                    <div className="trip-info">
                        <div className="trip-location">
                            <MapPin className="trip-info-icon" />
                            <p className="trip-location-text">{trip.trip_location}</p>
                        </div>

                        {days.length > 0 && (
                            <div className="trip-dates">
                                <Calendar className="trip-info-icon" />
                                <p className="trip-dates-text">
                                    {new Date(days[0].day_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                    {" - "}
                                    {new Date(days[days.length - 1].day_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="image-banner" />

                    <div className="button-level-bar">
                        <h1 className="itinerary-text">Itinerary</h1>
                        <div className="itinerary-buttons">
                            <button onClick={() => setOpenNewDay(true)} id="new-day-button">+ New Day</button>
                            {openActivitySearch === false &&
                                <button onClick={() => setOpenActivitySearch(true)} id="add-activity-button">+ Add Activity</button>
                            }
                        </div>
                    </div>

                    <div className="days-container">
                        {days.length === 0 ? (
                            <p className="empty-state-text">No days added to your itinerary yet. Click <span>+ New Day</span> to get started!</p>
                        ) : (
                            days.map((day, index) => (
                                <div key={day.day_id} className="day-card">
                                    <div className="top-of-day-card">
                                        <p className="day-title">Day {index + 1}</p>
                                    </div>

                                    <p className="day-date">
                                        {new Date(day.day_date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                                    </p>

                                    <div className="number-of-activities">
                                        {day.activities?.length ?? 0} Activities
                                    </div>

                                    {(day.activities?.length ?? 0) === 0 ? (
                                        <p className="add-activity-blurb">
                                            No activities planned. Add an activity from the sidebar
                                        </p>
                                    ) : (
                                        <div className="activities">{/* Render activities here */}</div>
                                    )}

                                    <div className="day-actions">
                                        <EllipsisVertical className="day-actions-ellipsis" onClick={() => toggleMenu(day.day_id)} />
                                        {openMenu === day.day_id && (
                                            <div className="day-menu">
                                                <button onClick={() => setDeleteDayId(day.day_id)}>
                                                    <Trash2 className="trash-icon" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {newDay && (
                        <Popup
                            title="New Day"
                            buttons={
                                <>
                                    <button type="button" onClick={() => setOpenNewDay(null)}>Cancel</button>
                                    <button type="button" onClick={handleAddDay}>+ Add</button>
                                </>
                            }
                        >
                            <p className="popup-body-text">Do you want to add a new day to {trip?.trip_name}?</p>
                        </Popup>
                    )}
                    {deleteDayId && (
                        <Popup
                            title="Delete Day"
                            buttons={
                                <>
                                    <button type="button" onClick={() => setDeleteDayId(null)}>Cancel</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleDeleteDay(deleteDayId);
                                            setDeleteDayId(null);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </>
                            }
                        >
                            <p className="popup-body-text">
                                Are you sure you want to delete this day? You will lose all activities for this
                            </p>
                        </Popup>
                    )}
                </main>
                <div className="activity-search-sidebar" >
                    {openActivitySearch &&
                        <ActivitySearch
                            onClose={() => setOpenActivitySearch(false)}
                            days={Array.isArray(days) ? days.length : days}   // count
                            dayIds={Array.isArray(days) ? days.map(d => d.day_id) : []}  // ids
                            onActivityAdded={fetchDays}                       // refresh after save
                        />

                    }
                </div>
            </div>
        </div>
    );
}
