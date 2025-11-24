import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Calendar, EllipsisVertical, Trash2, ChevronDown, ChevronUp, Plus, UserPlus, X, Eye} from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import "../css/TripDaysPage.css";
import "../css/ImageBanner.css";
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
import {updateTrip} from "../../api/trips.js";
import {listParticipants, addParticipant, removeParticipant, getOwnerForTrip} from "../../api/trips";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const BASE_URL = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

export default function TripDaysPage() {

  //constants for data
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [userRole, setUserRole] = useState(null); 
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
  const [isAddCooldown, setIsAddCooldown] = useState(false);
  //Constants for image url
  const [imageUrl, setImageUrl] = useState(null);
  const [deleteActivity, setDeleteActivity] = useState(null);

  //constants for participants
  const [openParticipantsPopup, setOpenParticipantsPopup] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantUsername, setParticipantUsername] = useState("");
  const [allUsernames, setAllUsernames] = useState([]);
  const [owner, setOwner] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const participantFormRef = useRef(null);
  const MAX_DISPLAY_PFP = 4;
  const [activeUsers, setActiveUsers] = useState([]);

  const allPeople = [
    ...(owner ? [owner] : []),
    ...(Array.isArray(participants) ? participants : []),
  ];

  const uniquePeople = allPeople.filter(
    (person, index, self) =>
      index === self.findIndex(p => p.username === person.username)
  );

  const orderedPeople = [
    ...(user ? uniquePeople.filter(p => p.username === user.username) : []),
    ...uniquePeople.filter(p => p.username !== user?.username),
  ];

  const visibleParticipants = orderedPeople.slice(0, MAX_DISPLAY_PFP);
  const hiddenParticipants = orderedPeople.slice(MAX_DISPLAY_PFP);
  const hiddenCount = orderedPeople.length - visibleParticipants.length;
  const hiddenUsernamesString = hiddenParticipants.map(p => p.username).join('\n');

  // distance calculation states
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [transportMode, setTransportMode] = useState("DRIVE");
  const [distanceLoading, setDistanceLoading] = useState(false);
  const distanceDebounce = useRef(null);
  const distanceCache = useRef({});

  const navigate = useNavigate();


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

  const isOwner = userRole === "owner";
  const isShared = userRole === "shared";
  const isViewer = userRole === "viewer";
  const canEdit = isOwner || isShared;
  const canManageParticipants = isOwner;
  
  // Sets up Socket.IO connection and cleans up on disconnect. Also, performs actions, right now just a console.log and adding days. 
  useEffect(() => {
    // don't connect until user is loaded
    if (!user || !tripId) return;


    const socket = io("http://localhost:3000", {
      withCredentials: true
    });

    socket.on("connect", () => {
      console.log("Participant connected", socket.id);

      // emit joinTrip after connection with user data
      socket.emit("joinTrip", `trip_${tripId}`, {
        username: user.username,
        user_id: user.user_id
      });
    });

    socket.on("activeUsersUpdated", (users) => {
      console.log("Active users updated:", users);
      setActiveUsers(users);
    });

    //Listener that listens for "createdDay" from backend. Takes tripId from backend as json which is then 
    //compared to the tripId we are currently on(this will eventually be changed once rooms are implemented)
    //if tripIds match we retrive days and activities.
    socket.on("createdDay", () => {
      getDays(tripId).then((d) => mergeActivitiesIntoDays(d));
      toast.success("New day added successfully!");
    });

    socket.on("updatedDay", () => {
      getDays(tripId).then((d) => mergeActivitiesIntoDays(d));
      toast.info("Day moved");
    });

    socket.on("deletedDay", () => {
      getDays(tripId).then((d) => mergeActivitiesIntoDays(d));
      toast.success("Day has been deleted.");
    });

    socket.on("updatedActivity", (dayId, create) => {
      fetchDay(dayId);
      toast.success(create ? "Activity added!" : "Activity updated!");
    });

    socket.on("deletedActivity", (dayId) => {
      fetchDay(dayId);
      toast.success("Activity deleted!");
    });

    socket.on("noteUpdated", (dayId) => {
      fetchDay(dayId);
      toast.success("Notes updated successfully!");
    });

    return () => {
      if (socket.connected) {
        console.log("Participant disconnected", socket.id);
        socket.emit("leaveTrip", `trip_${tripId}`);
        socket.disconnect();
      }
    };
  }, [tripId, user]);

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

    fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
      "/shared/all/usernames",
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllUsernames(data.map(u => u.username));
        }
      })
      .catch((err) => console.error("Usernames fetch error:", err));
  }, []);

  //get the trip
  useEffect(() => {
    fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
      `/trip/read/${tripId}`,
      { credentials: "include" }
    )
      .then((res) => {
        if (res.status === 404 || res.status === 403) {
          navigate('/trip');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setTrip(data);
          setUserRole(data.user_role);
        }
      })
      .catch((err) => console.error("Trip fetch error:", err));
  }, [tripId, navigate]);

  //Fetch banner image url
  useEffect(() => {
    const fetchImage = async () => {
    if (!trip?.image_id) return;

      // Check if the image URL is already in localStorage global cache
      const cachedImageUrl = localStorage.getItem(`image_${trip.image_id}`);

      // If the image is cached, use it
      if (cachedImageUrl) {
        setImageUrl(cachedImageUrl);
        return;
      }

    try {
        const res = await fetch(
            `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/image/readone?imageId=${trip.image_id}`,
            { credentials: "include" }
        );

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Failed to fetch image.");
        }

        const data = await res.json();
        localStorage.setItem(`image_${trip.image_id}`, data);
        setImageUrl(data);
    } catch (err) {
        console.error("Failed to fetch image:", err);
        setError(err.message);
    }
    };

    fetchImage();
}, [trip?.image_id])

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
    // only fetch the days if the trip exists
    if(trip){
      fetchDays();
    }
  }, [tripId, trip]);

  const openAddDayPopup = (baseDateStr, insertBefore = false) => {
    if (!canEdit) {
      toast.error("You don't have permission to add days to this trip");
      return;
    }

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

  const handleOpenParticipantsPopup = async () => {
    try {
      const data = await listParticipants(trip.trips_id);
      setParticipants(data.participants || []);
      setOpenParticipantsPopup(true);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
      toast.error("Could not load participants.");
    }
  }

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
              credentials: "include",
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

  // Fetch a single day and that days activities
  const fetchDay = async (dayId) => {
    if (!tripId) return;
    try {
      const res = await fetch(`${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/activities/read/all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({dayId})
        }
      );
      const {activities} = await res.json();

      // sort activities by start time
      const sortedActivities = (activities || []).sort((a, b) => {
        const toMinutes = (t) => {
          if (!t) return 0;
          const [h, m, s] = t.split(":").map(Number);
          return (h || 0) * 60 + (m || 0) + (s ? s / 60 : 0);
        };
        return toMinutes(a.activity_startTime) - toMinutes(b.activity_startTime);
      });

      setDays(prevDays => {
        const updatedDays = prevDays.map(d => 
          d.day_id === dayId ? { ...d, activities: sortedActivities } : d);
        return updatedDays;
      });

      const newIds = days.map(d => d.day_id);

      /*if (!expandedInitRef.current) {
        // First load: mobile = collapsed, desktop = expanded
        setExpandedDays(window.innerWidth <= 600 ? [] : newIds);
        expandedInitRef.current = true;
      } else {
        // Later fetches: keep prior choices, just drop deleted day IDs
        setExpandedDays(prev => prev.filter(id => newIds.includes(id)));
      }*/
    } catch (err) {
      console.error(err);
    }
  };

  // Sets days with activities again using previous state.
  const mergeActivitiesIntoDays = (days) => {
    setDays(prev => {
      const prevMap = new Map(prev.map(d => [d.day_id, d]));

      return days.map(day => {
        if (prevMap.has(day.day_id)) {
          return { ...day, activities: prevMap.get(day.day_id).activities };
        }

        return { ...day, activities: [] };
      });
    });
  }

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
    if (!canEdit) {
      toast.error("You don't have permission to add days");
      return;
    }

    if (isAddCooldown) return;
    setIsAddCooldown(true);
    if (!newDay) return;

    try {
      await createDay(tripId, { day_date: newDay, newDayInsertBefore});

      if (newDayInsertBefore) {
        await updateTrip({
          ...trip,
          trip_start_date: newDay,
        });
      }

      setOpenNewDay(null);
      setNewDayInsertBefore(false);

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
    if (!canEdit) {
      toast.error("You don't have permission to delete days");
      return;
    }

    try {
      if (openMenu === dayId) setOpenMenu(null);

      // detects if first day is being deleted
      const isFirstDay = days.length > 0 && dayId === days[0].day_id;

      await deleteDay(tripId, dayId, isFirstDay);

      if (isFirstDay) {
        // if first day is deleted, update trip start date
        await updateTrip({
          ...trip,
          trip_start_date: days[1].day_date.split("T")[0],
        });
      }

    } catch (err) {
      console.error("Error deleting day:", err);
      toast.error("Failed to delete day. Please try again.");
    }
  };

  // update an activity
  const handleUpdateActivity = async (activityId, activity, dayId) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit activities");
      return;
    }

    try {
      const response = await fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        `/activities/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            tripId: trip.trips_id,
            activityId,
            activity: {
              startTime: activity.activity_startTime,
              duration: Number(activity.activity_duration),
              estimatedCost: Number(activity.activity_estimated_cost),
              notesForActivity: activity.notesForActivity || "",
              dayId: dayId
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update activity");
      }
      setEditActivity(null);
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Failed to update activity. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId, dayId) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete activities");
      return;
    }

    try {
      const tripId = trip.trips_id;
      const response = await fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        `/activities/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tripId, activityId, dayId }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete activity");

    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity. Please try again.");
    }
  };

  const confirmDeleteActivity = (activity) => {
    if (!canEdit) {
      toast.error("You don't have permission to delete activities");
      return;
    }
    setDeleteActivity(activity);
  };

  const updateNotesForActivity = async (id, newNote, dayId) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit notes");
      return;
    }

    try {
      const url = `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/activities/updateNotes`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tripId: trip.trips_id,
          activityId: id,
          notes: newNote,
          dayId: dayId
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
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    setDragFromDay(day);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDayDragOver = (e, day) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    setDragOverInfo({
      dayId: day.day_id,
      dayDate: day.day_date,
    });
  };

  const handleDayDrop = async (e, day) => {
    if (!canEdit) return;
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
    if (!canEdit) {
      toast.error("You don't have permission to reorder days");
      return;
    }

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
          await updateDay(tripId, d.day_id, { day_date: newDate, finalUpdate: false });
        }

        await updateDay(tripId, dragFromDay.day_id, { day_date: first.day_date , finalUpdate: true});

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
            await updateDay(tripId, eachDay.day_id, { day_date: newDate, finalUpdate: false });
            movedDayDate = overDay.day_date;
          }
        }
        // future day dragged
        else {
          if (eachDayDate > overDate && eachDayDate <= dragDate) {
            // days after the drop target move forward 1 day
            const newDate = adjustDate(eachDay.day_date, 1);
            await updateDay(tripId, eachDay.day_id, { day_date: newDate, finalUpdate: false });
            movedDayDate = adjustDate(overDay.day_date, 1);
          }
        }
      }

      // Finally, update the date of the day we're dragging
      await updateDay(tripId, dragFromDay.day_id, { day_date: movedDayDate, finalUpdate: true });

      setDragFromDay(null);
      setDragOverInfo({ dayId: null, index: null });
    } catch (error) {
      toast.error("Error reordering days: " + error.message);
    }
  }

  // add particpant to a trip
  const handleAddParticipant = async () => {
    if (!canManageParticipants) {
      toast.error("Only the trip owner can add participants");
      return;
    }

    if (!participantUsername.trim()) return;

    try {
      await addParticipant(trip.trips_id, participantUsername.trim());
      const data = await listParticipants(trip.trips_id);
      setParticipants(data.participants || []);
      setParticipantUsername("");
      setShowSuggestions(false);
      toast.success("Participant added!");
    } catch (err) {
      console.error("Failed to add participant:", err);
      toast.error(err.message || "Failed to add participant.");
    }
  };

  // remove participant from a trip
  const handleRemoveParticipant = async (username) => {
    if (!canManageParticipants) {
      toast.error("Only the trip owner can remove participants");
      return;
    }

    try {
      await removeParticipant(trip.trips_id, username);
      setParticipants(prev => prev.filter(p => p.username !== username));
      toast.success("Participant removed!");
    } catch (err) {
      console.error("Failed to remove participant:", err);
      toast.error(err.message || "Failed to remove participant.");
    }
  };

  // participant username suggestions
  const participantSuggestions = useMemo(() => {
    const q = (participantUsername || "").trim().toLowerCase();
    if (!q) return [];
    return allUsernames
      .filter((name) => name.toLowerCase().includes(q))
      .filter((name) => name !== user?.username)
      .slice(0, 4);
  }, [allUsernames, participantUsername, user?.username]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (participantFormRef.current && !participantFormRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    if (openParticipantsPopup) {
      document.addEventListener("mousedown", onDocClick);
    }
    
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openParticipantsPopup]);

  useEffect(() => {
    if (trip?.trips_id && !isGuestUser(user?.user_id) && !isViewer) {
      listParticipants(trip.trips_id)
        .then(data => {
          setParticipants(data.participants || []);
        })
        .catch(err => {
          // Don't toast here, as it's a background load
          console.error("Failed to fetch participants for title display:", err);
        });
      getOwnerForTrip(trip.trips_id)
        .then(data => {
          setOwner(data.owner || []);
        })
        .catch(err => {
          console.error("Failed to fetch owner for title display:", err);
        });
    }
  }, [trip?.trips_id, isViewer]);

  const isGuestUser = (userId) => {
    return userId && userId.toString().startsWith('guest_');
  };

  const isUserActive = (username) => {
    return activeUsers.some(u => u.username === username);
  };

  //Loading State
  if (!user || !trip) {
    return (
      <div className="setting-page">
        <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>
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
      <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>

      <div className="content-with-sidebar">
        <NavBar />
        <main className={`TripDaysPage ${openActivitySearch ? "drawer-open" : ""}`}>
          <div className="title-div">
            <h1 className="trip-title">{trip.trip_name}</h1>
            {isViewer && (
              <span className="permission-badge viewer-badge">
                <Eye className = "view-icon"/> Viewing Only
              </span>
            )}
            {canEdit && (
            <div className="participant-photos">
               {visibleParticipants.map((p) =>
                 p.photo ? (
                   <img
                     key={`${p.user_id || ''}-${p.username}`}
                     className={`participant-pfp ${isUserActive(p.username) ? 'active' : ''}`}
                     src={p.photo}
                     alt={p.username}
                     title={p.username}
                   />
                 ) : (
                   <div
                     key={`${p.user_id || ''}-${p.username}`}
                     className="participant-pfp placeholder"
                     title={p.username}
                   >
                     {p.username?.charAt(0).toUpperCase() || '?'}
                   </div>
                 )
               )}

                {hiddenCount > 0 && (
                  <div
                    className="participant-pfp placeholder remainder"
                    title={hiddenUsernamesString}
                  >
                    +{hiddenCount}
                  </div>
                )}
            </div>
            )}
          </div>

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

          <div className="image-banner">
            <img
            src={imageUrl}
            alt={trip.trip_name}
            id={`image${trip.image_id}`}
      />
           </div>
          <div className="button-level-bar">
            <h1 className="itinerary-text">Itinerary</h1>
            {canEdit && (
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
                {canManageParticipants && (
                  <button
                    onClick={() => handleOpenParticipantsPopup()} 
                    id="participants-button">
                    <UserPlus id="user-plus-icon" size={14}/>
                    <span>Share</span> 
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="days-scroll-zone">
            <div className="days-container">
              {days.length === 0 ? (
                <p className="empty-state-text">
                  {canEdit 
                    ? "No days added to your itinerary yet. Click + New Day to get started!" 
                    : "No days have been added to this itinerary yet."}
                </p>
              ) : (
                days.map((day, index) => {
                  const isExpanded = expandedDays.includes(day.day_id);
                  return (
                    <React.Fragment key={day.day_id}>
                      {index === 0 && canEdit && (
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
                        className={`day-card ${isMobile ? (isExpanded ? "expanded" : "collapsed") : ""}`}
                        draggable={canEdit}
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

                        {canEdit && (
                          <div
                            className="day-actions"
                            ref={(el) => (menuRefs.current[day.day_id] = el)}
                          >
                            <button
                              type="button"
                              className={`day-actions-ellipsis ${openMenu === day.day_id ? "is-open" : ""}`}
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
                        )}

                        {isExpanded && (
                          <>
                            {(day.activities?.length ?? 0) === 0 ? (
                              <p className="add-activity-blurb">
                                {canEdit 
                                  ? "No activities planned. Add an activity from the sidebar." 
                                  : "No activities have been planned for this day yet."}
                              </p>
                            ) : (
                              <div className="activities">
                                {day.activities.map((activity) => (
                                  <ActivityCard
                                    key={activity.activity_id}
                                    role = {userRole}
                                    activity={activity}
                                    onDelete={canEdit ? () => confirmDeleteActivity(activity) : undefined}
                                    onEdit={canEdit ? (activity) => setEditActivity(activity, day.day_id) : undefined}
                                    onViewNotes={(activity) => {
                                      setSelectedActivity(activity);
                                      setOpenNotesPopup(true);
                                      setEditableNote(activity.notes || "");
                                    }}
                                    readOnly={!canEdit}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {canEdit && (
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
                      )}
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
                  <button onClick={() => setOpenNotesPopup(false)}>
                    {canEdit ? "Cancel" : "Close"}
                  </button>
                  {canEdit && (
                    <button
                      className="btn-rightside"
                      onClick={() => {
                        updateNotesForActivity(selectedActivity.activity_id, editableNote, selectedActivity.day_id);
                        setOpenNotesPopup(false);
                      }}
                    >
                      Save
                    </button>
                  )}
                </>
              }
            >
              <textarea
                value={editableNote}
                onChange={(e) => setEditableNote(e.target.value)}
                placeholder={canEdit ? "Enter your notes here" : "No notes available"}
                maxLength={200}
                className="textarea-notes"
                rows={5}
                readOnly={!canEdit}
              />
              {canEdit && (
                <div className="char-count">
                  {editableNote.length} / 200
                </div>
              )}
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
                    onClick={handleAddDay}
                    disabled={isAddCooldown}
                    className={`add-day-button btn-rightside ${isAddCooldown ? "cooldown" : ""}`}

                  >
                    Add +
                  </button>
                </>
              }
            >
              <p className="popup-body-text">Do you want to add a new day to {trip?.trip_name}?</p>
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
                    className={"btn-rightside"}
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
                Are you sure you want to delete this day? You will lose all activities for this day
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
                      handleDeleteActivity(deleteActivity.activity_id, deleteActivity.day_id);
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
                      }, 
                      editActivity.day_id
                    );
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
                    activityId={editActivity.activity_id}
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
          {openParticipantsPopup && (
            <Popup 
              id="participants-popup"
              title="Participants"
              onClose={() => setOpenParticipantsPopup(false)}
            >
              {canManageParticipants && (
                <div className="add-participant-form" ref={participantFormRef}>
                  <div className="search-wrap">
                    <input
                      type="text"
                      placeholder="Enter username to add"
                      id="username-input"
                      value={participantUsername}
                      onChange={(e) => setParticipantUsername(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      autoCapitalize="off"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />

                    {showSuggestions && participantSuggestions.length > 0 && (
                      <ul className="autocomplete">
                        {participantSuggestions.map((s, i) => (
                          <li
                            key={i}
                            onClick={() => {
                              setParticipantUsername(s);
                              setShowSuggestions(false);
                            }}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button type="button" className="add-participant-btn" onClick={handleAddParticipant}>
                    <UserPlus size={16} /> Add
                  </button>
                </div>
              )}
              <div className="participants-list">
                {participants.length === 0 ? (
                  <p>No other participants on this trip.</p>
                ) : (
                  participants.map((p) => (
                    <div key={p.user_id} className="participant-item">
                      <span>{p.username}</span>
                      {canManageParticipants && (
                        <button
                          type="button"
                          className="remove-participant-btn"
                          onClick={() => handleRemoveParticipant(p.username)}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Popup>
          
          )}
        </main>

        {openActivitySearch && canEdit && (
          <div className="activity-search-sidebar open">
            <ActivitySearch
              onClose={() => setOpenActivitySearch(false)}
              days={Array.isArray(days) ? days.length : days}
              dayIds={Array.isArray(days)
                ? days.map((d) => d.day_id)
                : []}
              onActivityAdded={(dayId) => fetchDay(dayId)}
              allDays={days}
            />
          </div>
        )}
      </div>
    </div>
  );
}
