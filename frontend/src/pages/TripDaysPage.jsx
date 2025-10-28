import React, { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, EllipsisVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";

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
  const [editActivity, setEditActivity] = useState(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editCost, setEditCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [openNotesPopup, setOpenNotesPopup] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editableNote, setEditableNote] = useState("");
  const [isAddCooldown, setIsAddCooldown] = useState(false);

  const [expandedDays, setExpandedDays] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  const menuRefs = useRef({});
  const { tripId } = useParams();

  //responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //outside Click Close
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInside = Object.values(menuRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      if (!clickedInside) setOpenMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
      "/auth/login/details",
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn !== false) setUser(data);
      })
      .catch((err) => console.error("User fetch error:", err));
  }, []);

  //get the trip
  useEffect(() => {
    fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
      `/trip/read/${tripId}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => setTrip(data))
      .catch((err) => console.error("Trip fetch error:", err));
  }, []);

  useEffect(() => {
    if (editActivity) {
      // format start time
      let start = "";
      if (editActivity.activity_startTime) {
        const parts = editActivity.activity_startTime.split(":");
        if (parts.length >= 2) {
          const h = parts[0].padStart(2, "0");
          const m = parts[1].padStart(2, "0");
          start = `${h}:${m}`;
        }
      }
      setEditStartTime(start);

      // need to convert time into minutes from db
      const durationObj = editActivity.activity_duration || { hours: 0, minutes: 0 };
      const totalMinutes = (durationObj.hours || 0) * 60 + (durationObj.minutes || 0);

      setEditDuration(totalMinutes);

      // cost
      setEditCost(editActivity.activity_price_estimated ?? "");

      setNotes(editActivity.notes || "");
    }
  }, [editActivity]);

  //Fetch Days
  useEffect(() => {
    fetchDays();
  }, [tripId]);

  const fetchDays = async () => {
    if (!tripId) return;
    try {
      const data = await getDays(tripId);

      const daysWithActivities = await Promise.all(
        data.map(async (day) => {
          const res = await fetch(
            `${import.meta.env.PROD
              ? VITE_BACKEND_URL
              : LOCAL_BACKEND_URL
            }/activities/read/all`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dayId: day.day_id }),
            }
          );
          const { activities } = await res.json();

          // sort activities by start time
          const sortedActivities = (activities || []).sort((a, b) => {
            const toMinutes = (t) => {
              if (!t) return 0;
              const [h, m, s] = t.split(":").map(Number);
              return (h || 0) * 60 + (m || 0) + (s ? s / 60 : 0);
            };
            return toMinutes(a.activity_startTime) - toMinutes(b.activity_startTime);
          });

          return { ...day, activities: sortedActivities };
        })
      );
      setDays(daysWithActivities);
      setExpandedDays(window.innerWidth <= 600 ? [] : daysWithActivities.map((day) => day.day_id));

    } catch (err) {
      console.error(err);
    }
  };
  //add a new day
  const handleAddDay = async () => {
    if (isAddCooldown) return; // stop if still in cooldown
    setIsAddCooldown(true);    // start cooldown
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
      toast.success("New day added successfully!");
    } catch (err) {
      console.error("Error creating day:", err);
      toast.error("Failed to add day. Please try again.");
    } finally {
      // end cooldown after 3 seconds
      setTimeout(() => setIsAddCooldown(false), 3000);
    }

  };

  //delete a day
  const handleDeleteDay = async (dayId) => {
    try {
      if (openMenu === dayId) setOpenMenu(null);
      await deleteDay(tripId, dayId);
      await fetchDays();
      toast.success("Day has been deleted.");
    } catch (err) {
      console.error("Error deleting day:", err);
      toast.error("Failed to delete day. Please try again.");
    }
  };

  // update an activity
  const handleUpdateActivity = async (activityId, activity) => {
    try {
      const response = await fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        `/activities/update`,
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
              notesForActivity: activity.notesForActivity || ""
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
      toast.success("Activity updated successfully!");
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Failed to update activity. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      const response = await fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        `/activities/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ activityId }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete activity");

      // Update the days state by removing the deleted activity
      setDays(prevDays =>
        prevDays.map(day => ({
          ...day,
          activities: day.activities?.filter(a => a.activity_id !== activityId) || []
        }))
      );

      toast.success("Activity deleted successfully!");
      await fetchDays();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity. Please try again.");
    }
  };

  const updateNotesForActivity = async (id, newNote) => {
    try {
      console.log("Updating notes for activity ID:", id, "to:", newNote);

      const url = `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/activities/updateNotes`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: id,
          notes: newNote
        }),
      });


      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update notes");
      }

      setDays(prevDays =>
        prevDays.map(day => ({
          ...day,
          activities: day.activities?.map(act =>
            String(act.activity_id) === String(id)
              ? { ...act, notes: newNote }
              : act
          ) || []
        }))
      );

      toast.success("Notes updated successfully!");
      return true;
    } catch (err) {
      console.error("Error updating notes:", err);
      toast.error("Failed to update notes. Please try again.");
      return false;
    }
  };

  const toggleMenu = (dayId) => {
    setOpenMenu(openMenu === dayId ? null : dayId);
  };

  //Loading State
  if (!user || !trip) {
    return (
      <div className="setting-page">
        <TopBanner user={user} />
        <div className="content-with-sidebar">
          <NavBar />
          <div className="main-content">
            <div className="page-loading-container">
              <MoonLoader
                color="var(--accent)"
                size={70}
                speedMultiplier={0.9}
                data-testid="loader"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="page-layout">
      <TopBanner user={user} />

      <div className="content-with-sidebar">
        <NavBar />
        <main className={`TripDaysPage ${openActivitySearch ? "drawer-open" : ""}`}>
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
                  {new Date(days[0].day_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(
                    days[days.length - 1].day_date
                  ).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="image-banner" />
          <div className="button-level-bar">
            <h1 className="itinerary-text">Itinerary</h1>
            <div className="itinerary-buttons">
              <button onClick={() => setOpenNewDay(true)} id="new-day-button">
                + New Day
              </button>
              {!openActivitySearch && (
                <button
                  onClick={() => setOpenActivitySearch(true)}
                  id="add-activity-button"
                >
                  + Add Activity
                </button>
              )}
            </div>
          </div>

          <div className="days-container">
            {days.length === 0 ? (
              <p className="empty-state-text">
                No days added to your itinerary yet. Click{" "}
                <span>+ New Day</span> to get started!
              </p>
            ) : (
              days.map((day, index) => {
                const isExpanded = expandedDays.includes(day.day_id);
                return (
                  <div
                    key={day.day_id}
                    className={`day-card ${isMobile ? (isExpanded ? "expanded" : "collapsed") : ""
                      }`}
                  >
                    <div
                      className="day-header"
                      onClick={() => {
                        setExpandedDays((prev) =>
                          prev.includes(day.day_id)
                            ? prev.filter((id) => id !== day.day_id) // collapse this one
                            : [...prev, day.day_id] // expand new one, keep others open
                        );
                      }}

                    >
                      <div>
                        <p className="day-title">Day {index + 1}</p>
                        <p className="day-date">
                          {new Date(day.day_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="day-header-bottom">
                        <span className="number-of-activities">
                          {day.activities?.length ?? 0} Activities
                        </span>
                        <button className="chevron-button">
                          {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      </div>
                    </div>

                    {/*Ellipsis(always rendered)*/}
                    <div
                      className="day-actions"
                      ref={(el) => (menuRefs.current[day.day_id] = el)}
                    >
                      <button
                        type="button"
                        className={`day-actions-ellipsis ${openMenu === day.day_id ? "is-open" : ""
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(day.day_id);
                        }}
                      >
                        <EllipsisVertical />
                      </button>

                      {openMenu === day.day_id && (
                        <div className="day-menu" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setDeleteDayId(day.day_id)}>
                            <Trash2 className="trash-icon" /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <>
                        {(day.activities?.length ?? 0) === 0 ? (
                          <p className="add-activity-blurb">
                            No activities planned. Add an activity from the sidebar.
                          </p>
                        ) : (
                          <div className="activities">
                            {day.activities.map((activity) => (
                              <ActivityCard
                                key={activity.activity_id}
                                activity={activity}
                                onDelete={handleDeleteActivity}
                                onEdit={(activity) => setEditActivity(activity)}
                                onViewNotes={(activity) => {
                                  setSelectedActivity(activity);
                                  setOpenNotesPopup(true);
                                  setEditableNote(activity.notes || "");
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {openNotesPopup && selectedActivity && (
            <Popup
              title={"Notes for: " + selectedActivity.activity_name}
              buttons={
                <>
                  <button onClick={() => setOpenNotesPopup(false)}>Cancel</button>
                  <button
                    onClick={() => {
                      updateNotesForActivity(selectedActivity.activity_id, editableNote);
                      setOpenNotesPopup(false);
                    }}
                  >
                    Save
                  </button>
                </>
              }
            >
              <textarea
                value={editableNote}
                onChange={(e) => setEditableNote(e.target.value)}
                placeholder="Enter your notes here"
                maxLength={200}
                className="textarea-notes"
                rows={5}
              />
              <div className="char-count">
                {editableNote.length} / 200
              </div>
            </Popup>
          )}


          {newDay && (
            <Popup
              title="New Day"
              buttons={
                <>
                  <button type="button" onClick={() => setOpenNewDay(null)}>Cancel</button>
                  <button
                    type="button"
                    onClick={handleAddDay}
                    disabled={isAddCooldown}
                    style={{
                      opacity: isAddCooldown ? 0.5 : 1,
                      pointerEvents: isAddCooldown ? "none" : "auto",
                    }}
                  >
                    Add +
                  </button>                                </>
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

          {editActivity && (
            <Popup
              title="Edit Activity"
              buttons={
                <>
                  <button
                    type="button"
                    onClick={() => setEditActivity(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateActivity(editActivity.activity_id, {
                        activity_startTime: editStartTime,
                        activity_duration: editDuration,
                        activity_estimated_cost: editCost,
                        notesForActivity: notes || ""
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
                  onChange={(e) =>
                    setEditStartTime(e.target.value)
                  }
                />
              </label>

              <label className="popup-input">
                <span>Duration (minutes):</span>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) =>
                    setEditDuration(e.target.value)
                  }
                />
              </label>

              <label className="popup-input">
                <span>Notes</span>
                <textarea
                  className="textarea-notes"
                  maxLength={200}
                  placeholder="Enter any notes you have about your activity!"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                <div className="char-count">
                  {notes.length} / 200
                </div>
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

        {openActivitySearch && (
          <div className="activity-search-sidebar open">

            <ActivitySearch
              onClose={() => setOpenActivitySearch(false)}
              days={Array.isArray(days) ? days.length : days}
              dayIds={Array.isArray(days)
                ? days.map((d) => d.day_id)
                : []}
              onActivityAdded={fetchDays}
            />
          </div>
        )}
      </div>
    </div>
  );
}