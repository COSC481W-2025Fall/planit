import React, { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, EllipsisVertical, Trash2, ChevronDown, ChevronUp, Car, Footprints, Plus} from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import "../css/TripDaysPage.css";
import "../css/Popup.css";
import Popup from "../components/Popup";
import ActivitySearch from "../components/ActivitySearch.jsx";
import NavBar from "../components/NavBar";
import TopBanner from "../components/TopBanner";
import {getDays, createDay, deleteDay, updateDay} from "../../api/days";
import ActivityCard from "../components/ActivityCard.jsx";
import { useParams } from "react-router-dom";
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";
import OverlapWarning from "../components/OverlapWarning.jsx";
import axios from "axios";
import DistanceAndTimeInfo from "../components/DistanceAndTimeInfo.jsx";

const BASE_URL = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

export default function TripDaysPage() {

    //constants for data
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [deleteDayId, setDeleteDayId] = useState(null);

  //constants for UI components
  const [openMenu, setOpenMenu] = useState(null);
  const [newDay, setOpenNewDay] = useState(null);
  const [newDayInsertBefore, setNewDayInsertBefore] = useState(false);
  const [openActivitySearch, setOpenActivitySearch] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [editStartTime, setEditStartTime] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editCost, setEditCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [openNotesPopup, setOpenNotesPopup] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editableNote, setEditableNote] = useState("");
  const [deleteActivity, setDeleteActivity] = useState(null);

  // distance calculation states
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [transportMode, setTransportMode] = useState("DRIVE");
  const [distanceLoading, setDistanceLoading] = useState(false);
  const distanceDebounce = useRef(null);
  const distanceCache = useRef({});

  const [expandedDays, setExpandedDays] = useState(() => {
    try {
      const saved = localStorage.getItem("planit:expandedDays");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("planit:expandedDays", JSON.stringify(expandedDays));
    } catch {}
  }, [expandedDays]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const expandedInitRef = useRef(false);

  const menuRefs = useRef({});
  const { tripId } = useParams();
  const [dragFromDay, setDragFromDay] = useState("");
  const [dragOverInfo, setDragOverInfo] = useState({
    dayId: null,
    dayDate: null,
  });

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

      // reset distance info when opening edit
      setDistanceInfo(null);
      setTransportMode("DRIVE");

      // Trigger initial distance check if start time exists
      if (start) {
        handleDistanceCheck(start);
      }
    }
  }, [editActivity]);

  //Fetch Days
  useEffect(() => {
    fetchDays();
  }, [tripId]);

  const openAddDayPopup = (baseDateStr, insertBefore = false) => {
    let nextDate;
    if (baseDateStr && insertBefore) {
      const baseDate = new Date(baseDateStr);
      nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate()-1);
    } else if (baseDateStr) {
      const baseDate = new Date(baseDateStr);
      nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + 1);
    } else if (days.length > 0) {
      const lastDayDate = new Date(days[days.length - 1].day_date);
      nextDate = new Date(lastDayDate);
      nextDate.setDate(lastDayDate.getDate() + 1);
    } else {
      nextDate = new Date(trip.trip_start_date);
      nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());
    }

    const formatted = nextDate.toISOString().split("T")[0];
    setOpenNewDay(formatted);
    setNewDayInsertBefore(insertBefore);
  };

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
      const newIds = daysWithActivities.map(d => d.day_id);

      if (!expandedInitRef.current) {
        // First load: mobile = collapsed, desktop = expanded
        setExpandedDays(window.innerWidth <= 600 ? [] : newIds);
        expandedInitRef.current = true;
      } else {
        // Later fetches: keep prior choices, just drop deleted day IDs
        setExpandedDays(prev => prev.filter(id => newIds.includes(id)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // format duration helper
  const formatDuration = (minutes) => {
    if (minutes == null) return "N/A";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}mins`;
    return `${mins}mins`;
  };

  // toggle  between different transport modes
  const toggleTransportMode = () => {
    if (distanceLoading || !distanceInfo) return;
    const newMode = transportMode === "DRIVE" ? "WALK" : "DRIVE";
    setTransportMode(newMode);
  };

  // find distance between activities
  async function findDistance(origin, destination, transportation, previousActivity) {
    // create cache key
    const cacheKey = `${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}`;
    
    // check if we already have both distances cached
    if (distanceCache.current[cacheKey]?.DRIVE && distanceCache.current[cacheKey]?.WALK) {
      const cached = distanceCache.current[cacheKey];
      setDistanceInfo({
        driving: cached.DRIVE,
        walking: cached.WALK,
        previousActivityName: previousActivity.activity_name,
        prevActivityLat: previousActivity.latitude,
        prevActivityLng: previousActivity.longitude
      });
      return;
    }

    try {
      setDistanceLoading(true);
      
      // fetch both modes in parallel
      const [driveRes, walkRes] = await Promise.all([
        axios.post(`${BASE_URL}/routesAPI/distance/between/activity`, {
          origin,
          destination,
          wayOfTransportation: "DRIVE"
        }),
        axios.post(`${BASE_URL}/routesAPI/distance/between/activity`, {
          origin,
          destination,
          wayOfTransportation: "WALK"
        })
      ]);

      const driveData = {
        distanceMiles: driveRes.data.distanceMiles,
        durationMinutes: Math.round(driveRes.data.durationSeconds / 60)
      };
      
      const walkData = {
        distanceMiles: walkRes.data.distanceMiles,
        durationMinutes: Math.round(walkRes.data.durationSeconds / 60)
      };

      // cache both results
      distanceCache.current[cacheKey] = {
        DRIVE: driveData,
        WALK: walkData
      };

      setDistanceInfo({
        driving: driveData,
        walking: walkData,
        previousActivityName: previousActivity.activity_name,
        prevActivityLat: previousActivity.latitude,
        prevActivityLng: previousActivity.longitude
      });

    } catch (err) {
      toast.error("There was an issue trying to compute the distance");
      console.error(err);
    } finally {
      setDistanceLoading(false);
    }
  }

  // handle distance check when time changes
  const handleDistanceCheck = (startTime) => {
    if (!editActivity) return;

    if (distanceDebounce.current) clearTimeout(distanceDebounce.current);

    distanceDebounce.current = setTimeout(() => {
      try {
        const timeToMinutes = (t) => {
          if (!t) return 0;
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };

        const newTime = timeToMinutes(startTime);
        
        // find the day that contains this activity
        const currentDay = days.find(day => 
          day.activities?.some(act => act.activity_id === editActivity.activity_id)
        );

        if (!currentDay || !currentDay.activities) {
          setDistanceInfo(null);
          return;
        }

        const dayActivities = currentDay.activities;
        let prevActivity = null;

        for (let i = 0; i < dayActivities.length; i++) {
          const currActivity = dayActivities[i];
          
          // skip the activity being edited
          if (currActivity.activity_id === editActivity.activity_id) continue;

          const activityTime = timeToMinutes(currActivity.activity_startTime);

          // we found the prev activity
          if (activityTime >= newTime) break;
          prevActivity = currActivity;
        }

        if (!prevActivity) {
          setDistanceInfo(null);
          return;
        }

        const origin = {
          latitude: prevActivity.latitude,
          longitude: prevActivity.longitude,
        };
        const destination = {
          latitude: editActivity.latitude,
          longitude: editActivity.longitude,
        };

        findDistance(origin, destination, transportMode, prevActivity);
      } catch (err) {
        toast.error("Failed to fetch distance info.");
        console.error("Distance fetch error:", err?.response?.data || err.message);
      }
    }, 2500);
  };

  //add a new day
  const handleAddDay = async () => {
    if (!newDay) return;

    try {
      await createDay(tripId, { day_date: newDay, newDayInsertBefore});
      await fetchDays();
      setOpenNewDay(null);
      setNewDayInsertBefore(false);
      toast.success("New day added successfully!");
    } catch (err) {
      console.error("Error creating day:", err);
      toast.error("Failed to add day. Please try again.");
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

  const confirmDeleteActivity = (activity) => {
    setDeleteActivity(activity);
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

  //Drag and Drop
  const handleDayDragStart = (e, day) => {
    setDragFromDay(day);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDayDragOver = (e, day) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    setDragOverInfo({
      dayId: day.day_id,
      dayDate: day.day_date,
    });
  };

  const handleDayDrop = async (e, day) => {
    e.preventDefault();
    await reorderDays(dragFromDay, day);
  };

  const handleDragEnd = () => {
    setDragFromDay(null);
    setDragOverInfo({
      dayId: null,
      dayDate: null,
    });
  };

  const reorderDays = async (dragFromDay, overDay) => {
    try {
      const adjustDate = (dateStr, daysToAdd) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      };

      const dragDate = new Date(dragFromDay.day_date);
      const overDate = new Date(overDay.day_date);

      let reorderedFirstDay = false;
      const isDropOnFirstDay = overDay.day_id === days[0].day_id;
      const isDraggedFromAfterFirst = dragDate > overDate;
      const isHoveringBeforeFirst = dragOverInfo.dayId === "before-first";
      if (isDropOnFirstDay && isDraggedFromAfterFirst && isHoveringBeforeFirst) {
        const first = days[0];

        // shift existing days forward by 1 that are before the dragged day
        for (const d of days) {
          if (d.day_date > dragFromDay.day_date) continue;
          const newDate = adjustDate(d.day_date, 1);
          await updateDay(tripId, d.day_id, { day_date: newDate });
        }

        await updateDay(tripId, dragFromDay.day_id, { day_date: first.day_date });

        await fetchDays();
        toast.info("Day moved");
        setDragFromDay(null);
        setDragOverInfo({ dayId: null, dayDate: null });
        reorderedFirstDay = true;
      }

      // if dropped draggedDay is before the first day, shifting took place and should exit this method.
      if (reorderedFirstDay) return;

      let movedDayDate;

      if (dragFromDay === days[days.length-1] && overDay === days[days.length-2]
      || dragFromDay === days[0] && overDay === days[0]
      || overDay === days[days.indexOf(dragFromDay)-1]
      || overDay === dragFromDay) {
        toast.warning("No days were moved");
        setDragFromDay(null);
        setDragOverInfo({ dayId: null, index: null });
        return;
      }
      for (const eachDay of days) {
        const eachDayDate = new Date(eachDay.day_date);

        // don't modify the day we're dragging to move
        if (eachDay.day_id === dragFromDay.day_id) {
          continue;
        }

        // past day dragged
        if (dragDate < overDate){
          if (eachDayDate <= overDate && eachDayDate >= dragDate) {
            // days before the drop target move back 1 day
            const newDate = adjustDate(eachDay.day_date, -1);
            await updateDay(tripId, eachDay.day_id, { day_date: newDate });
            movedDayDate = overDay.day_date;
          }
        }
        // future day dragged
        else {
          if (eachDayDate > overDate && eachDayDate <= dragDate) {
            // days after the drop target move forward 1 day
            const newDate = adjustDate(eachDay.day_date, 1);
            await updateDay(tripId, eachDay.day_id, { day_date: newDate });
            movedDayDate = adjustDate(overDay.day_date, 1);
          }
        }
      }

      // Finally, update the date of the day we're dragging
      await updateDay(tripId, dragFromDay.day_id, { day_date: movedDayDate });

      await fetchDays();
      toast.info("Day moved");

      setDragFromDay(null);
      setDragOverInfo({ dayId: null, index: null });
    } catch (error) {
      toast.error("Error reordering days: " + error.message);
    }
  }

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
              <button onClick={() => openAddDayPopup(null)} id="new-day-button">
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
          </div><
          div className="days-scroll-zone">
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
                  <React.Fragment key={day.day_id}>
                    {index === 0 && (
                        <div
                            className={`day-divider day-divider--first ${dragOverInfo.dayId === 'before-first' ? "day-divider--drag-over" : ""}`}
                            onDragOver={(e) => handleDayDragOver(e, { day_id: 'before-first', day_date: day.day_date })}
                            onDrop={(e) => handleDayDrop(e, day)}
                        >
                          {!dragFromDay && (
                          <button onClick={() => openAddDayPopup(day.day_date, true)}>
                            <Plus size={17} className="plus-icon"/>
                          </button>
                              )}
                        </div>
                    )}
                    <div
                        className={`day-card ${isMobile ? (isExpanded ? "expanded" : "collapsed") : ""
                        }`}
                        draggable={true}
                        key={day.day_id}
                        onDragStart={(e) => handleDayDragStart(e, day)}
                        onDragEnd={(e) => handleDragEnd(e)}
                    >
                    <div
                      className="day-header"
                      onClick={() => {
                        setExpandedDays((prev) =>
                          prev.includes(day.day_id)
                            ? prev.filter((id) => id !== day.day_id)
                            : [...prev, day.day_id]
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
                                onDelete={() => confirmDeleteActivity(activity)}
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
                    <div
                      className={`day-divider ${dragOverInfo.dayId === day.day_id ? "day-divider--drag-over" : ""}`}
                      id={index === days.length - 1 ? "last-day-divider" : ""}
                      onDragOver={(e) => handleDayDragOver(e, day)}
                      onDrop={(e) => handleDayDrop(e, day)}
                    >
                      {!dragFromDay && (
                      <button onClick={() => openAddDayPopup(day.day_date)}>
                        <Plus size={17} className="plus-icon"/>
                      </button>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
          {openNotesPopup && selectedActivity && (
            <Popup
              title={"Notes for: " + selectedActivity.activity_name}
              onClose={() => setOpenNotesPopup(false)}
              buttons={
                <>
                  <button onClick={() => setOpenNotesPopup(false)}>Cancel</button>
                  <button
                    className="btn-rightside"
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
              onClose={() => setOpenNewDay(null)}
              buttons={
                <>
                  <button
                    type="button"
                    onClick={() => setOpenNewDay(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-rightside"
                    onClick={handleAddDay}
                  >
                    + Add
                  </button>
                </>
              }
            ><p className="popup-body-text">
                Do you want to add a new day to {trip?.trip_name}?
              </p>
            </Popup>
          )}

          {deleteDayId && (
            <Popup
              title="Delete Day"
              onClose={() => setDeleteDayId(null)}
              buttons={
                <>
                  <button
                    type="button"
                    onClick={() => setDeleteDayId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-rightside"
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
                Are you sure you want to delete this day? You will
                lose all activities for this day.
              </p>
            </Popup>
          )}

          {deleteActivity && (
            <Popup
              title={`Are you sure you want to delete ${deleteActivity.activity_name}?`}
              onClose={() => setDeleteActivity(null)}
              buttons={
                <>
                  <button
                    type="button"
                    onClick={() => setDeleteActivity(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-rightside"
                    onClick={() => {
                      handleDeleteActivity(deleteActivity.activity_id);
                      setDeleteActivity(null);
                    }}
                  >
                    Delete
                  </button>
                </>
              }
            >
              <p className="popup-body-text">
                This action cannot be undone.
              </p>
            </Popup>
          )}

          {editActivity && (
            <Popup
              title="Edit Activity"
              onClose={() => setEditActivity(null)}
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
                    className="btn-rightside"
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
              <DistanceAndTimeInfo
                distanceInfo={distanceInfo}
                transportMode={transportMode}
                distanceLoading={distanceLoading}
                onToggleTransportMode={toggleTransportMode}
                formatDuration={formatDuration}
              />

              <label className="popup-input" htmlFor="start-time-input">
                <span>Start Time:</span>
                <span>
                  <OverlapWarning
                    formStartTime={editStartTime}
                    formDuration={editDuration}
                    selectedDay={days.findIndex(d => d.day_id === editActivity.day_id) + 1}
                    dayIds={days.map((d) => d.day_id)}
                  />
                </span>
                <input className = "time-picker"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditStartTime(val);

                    // Clear distance info when user starts typing
                    setDistanceInfo(null);

                    // check if time is fully entered
                    if (/^\d{2}:\d{2}$/.test(val)) {
                      handleDistanceCheck(val);
                    }
                  }}
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