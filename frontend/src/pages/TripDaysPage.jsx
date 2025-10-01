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
import ActivityCard from "../components/ActivityCard.jsx";
import { useParams } from "react-router-dom";

export default function TripDaysPage() {
    //constants for data
    const [user, setUser] = useState(null);
    const [trip, setTrip] = useState(null);
    const [days, setDays] = useState([]);

    //constants for UI components
    const [openMenu, setOpenMenu] = useState(null);
    const [editDay, setEditDay] = useState(null);
    const [newDay, setOpenNewDay] = useState(null);
    const [openActivitySearch, setOpenActivitySearch] = useState(false);
    const [editActivity, setEditActivity] = useState(null);
    const [editStartTime, setEditStartTime] = useState("");
    const [editDuration, setEditDuration] = useState("");
    const [editCost, setEditCost] = useState(0);

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

    useEffect(() => {
        if (editActivity) {
            // format start time
            let start = "";
            if (editActivity.activity_startTime) {
                const date = new Date(editActivity.activity_startTime);
                const h = String(date.getHours()).padStart(2, "0");
                const m = String(date.getMinutes()).padStart(2, "0");
                start = `${h}:${m}`;
            }
            setEditStartTime(start);

            // need to convert time into minutes from db
            const durationObj = editActivity.activity_duration || { hours: 0, minutes: 0 };
            const totalMinutes = (durationObj.hours || 0) * 60 + (durationObj.minutes || 0);

            setEditDuration(totalMinutes);

            // cost
            setEditCost(editActivity.activity_price_estimated ?? "");
        }
    }, [editActivity]);

    //initial fetch of days
    useEffect(() => {
        fetchDays();
    }, [tripId]);

    const fetchDays = async () => {
        if (!tripId) return;

        try {
            const data = await getDays(tripId);

            const daysWithActivities = await Promise.all(
                data.map(async (day) => {
                    const res = await fetch(`${LOCAL_BACKEND_URL}/activities/read/all`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dayId: day.day_id })
                    });
                    const { activities } = await res.json();

                    // sort activities by start time
                    const sortedActivities = (activities || []).sort((a, b) => {
                        const timeA = new Date(a.activity_startTime).getTime();
                        const timeB = new Date(b.activity_startTime).getTime();
                        return timeA - timeB;
                    });

                    return { ...day, activities: sortedActivities };
                })
            );

            setDays(daysWithActivities);
        } catch (err) {
            console.error(err);
        }
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

    // update an activity
    const handleUpdateActivity = async (activityId, activity) => {
        try {
            const response = await fetch(
                (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + `/activities/update`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        activityId,
                        activity: {
                            startTime: activity.activity_startTime,
                            duration: Number(activity.activity_duration),
                            estimatedCost: Number(activity.activity_estimated_cost),
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to update activity");
            }

            await fetchDays();
            setEditActivity(null);
        } catch (error) {
            console.error("Error updating activity:", error);
            alert("Failed to update activity. Please try again.");
        }
    };


    const handleDeleteActivity = async (activityId) => {
        try {
            const response = await fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + `/activities/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activityId }),
            });

            if (!response.ok) throw new Error("Failed to delete activity");

            // Update the days state by removing the deleted activity
            setDays(prevDays =>
                prevDays.map(day => ({
                    ...day,
                    activities: day.activities?.filter(a => a.activity_id !== activityId) || []
                }))
            );

        } catch (error) {
            console.error("Error deleting activity:", error);
            alert("Failed to delete activity. Please try again.");
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
            <TopBanner user={user} onSignOut={() => { console.log("Signed out"); window.location.href = "/"; }} />

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
                                        <div className="activities">
                                            {day.activities.map(activity => (
                                                <ActivityCard key={activity.activity_id} activity={activity} onDelete={handleDeleteActivity} onEdit={(activity) => setEditActivity(activity)} />
                                            ))}
                                        </div>
                                    )}


                                    <div className="day-actions">
                                        <EllipsisVertical className="day-actions-ellipsis" onClick={() => toggleMenu(day.day_id)} />
                                        {openMenu === day.day_id && (
                                            <div className="day-menu">
                                                <button onClick={() => handleDeleteDay(day.day_id)}>
                                                    <Trash2 className="trash-icon" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
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

                    {editActivity && (
                        <Popup
                            title={`Edit Activity`}
                            buttons={
                                <>
                                    <button type="button" onClick={() => setEditActivity(null)}>Cancel</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!editStartTime || !editDuration || !editCost) {
                                                alert("Please fill in all fields before saving.");
                                                return; 
                                            }
                                            handleUpdateActivity(editActivity.activity_id, {
                                                activity_startTime: editStartTime,
                                                activity_duration: editDuration,
                                                activity_estimated_cost: editCost,
                                            });
                                        }}
                                    >
                                        Save
                                    </button>

                                </>
                            }
                        >
                            <label className="popup-input">
                                <span>Start Time:</span>
                                <input
                                    type="time"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                />
                            </label>

                            <label className="popup-input">
                                <span>Duration (minutes):</span>
                                <input
                                    type="number"
                                    value={editDuration}
                                    onChange={(e) => setEditDuration(e.target.value)}
                                />
                            </label>

                            <label className="popup-input">
                                <span>Estimated Budget ($):</span>
                                <input
                                    type="number"
                                    value={editCost}
                                    onChange={(e) => setEditCost(e.target.value)}
                                />
                            </label>

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
