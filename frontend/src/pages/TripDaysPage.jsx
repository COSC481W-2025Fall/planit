import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Calendar, EllipsisVertical, Trash2, ChevronDown, ChevronUp, Plus, UserPlus, X, Eye, Luggage, ChevronRight, PiggyBank, Plane,Car,Train,Bus,Ship,Bed} from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL, LOCAL_FRONTEND_URL, VITE_FRONTEND_URL } from "../../../Constants.js";
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
import {getOwnerForTrip, retrievePackingItems, updateTrip, listParticipants, addParticipant, removeParticipant} from "../../api/trips";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {getWeather} from "../../api/weather.js";
import CloneTripButton from "../components/CloneTripButton.jsx";
import Label from "../components/Label.jsx";

const BASE_URL = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
const BASE_FRONTEND_URL = import.meta.env.PROD ? VITE_FRONTEND_URL : LOCAL_FRONTEND_URL

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
  const [showAllParticipantsPopup, setShowAllParticipantsPopup] = useState(false);
  const [activitySearchCity, setActivitySearchCity] = useState("");
  //Constants for image url
  const [imageUrl, setImageUrl] = useState(null);
  const [deleteActivity, setDeleteActivity] = useState(null);
  const weatherFetchedRef = useRef(false);

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
  const [weatherSummary, setWeatherSummary] = useState([]);
  const [dailyWeather, setDailyWeather] = useState([]);
  const [isPackingCooldown, setIsPackingCooldown] = useState(false);
  const socketDisconnectedRef = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [initialEntries, setInitialEntries] = useState([]);
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

  const isUserActive = (username) => {
    return activeUsers.some(u => u.username === username);
  };

  // Show ALL active users, hide only inactive users
  const activePeople = orderedPeople.filter(p => isUserActive(p.username));
  const inactivePeople = orderedPeople.filter(p => !isUserActive(p.username));

  const visibleParticipants = activePeople; // Show all active users
  const hiddenParticipants = inactivePeople; // Hide all inactive users
  const hiddenCount = hiddenParticipants.length;
  const hiddenUsernamesString = hiddenParticipants.map(p => p.username).join('\n');

  // distance calculation states
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [transportMode, setTransportMode] = useState("DRIVE");
  const [distanceLoading, setDistanceLoading] = useState(false);
  const distanceDebounce = useRef(null);
  const distanceCache = useRef({});

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const [transportType, setTransportType] = useState(null);
  const [transportInfo, setTransportInfo] = useState([]);
  const [accommodationInfo, setAccommodationInfo] = useState([]);
  const [modalType, setModalType] = useState(null); // "transport" or "accommodation"
  const [entries, setEntries] = useState([{ ticketNumber: "", price: "" }]);
  const dropdownRef = useRef(null);
  const [expandedDays, setExpandedDays] = useState(() => {
    try {
      const saved = localStorage.getItem("planit:expandedDays");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const transportTypeRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem("planit:expandedDays", JSON.stringify(expandedDays));
    } catch {}
  }, [expandedDays]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const expandedInitRef = useRef(false);

  const menuRefs = useRef({});
  const { tripId } = useParams();
  const fromExplore = new URLSearchParams(window.location.search).get("fromExplore") === "true";
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

  const [showAILabels, setShowAILabels] = useState(
      localStorage.getItem("planit:showAILabels") !== "false"
  );

  // Sets up Socket.IO connection, disconnect, and listeners.
  useEffect(() => {
    // don't connect until user information is loaded
    if (!user || !tripId || !userRole) return;

    // if they're a guest or just viewer they no socket.io needs to happen
    if (isGuestUser(user.user_id) || isViewer) {
      return;
    }

    const socket = io(BASE_URL, {
      withCredentials: true
    });

    socket.on("connect", () => {
      // clear disconnect flag on successful reconnection
      socketDisconnectedRef.current = false;

      // emit joinTrip after connection with user data
      socket.emit("joinTrip", `trip_${tripId}`, {
        username: user.username,
        user_id: user.user_id
      });
    });

    socket.on("activeUsersUpdated", (users) => {
      setActiveUsers(users);
    });

    //Listener that listens for "createdDay" from backend.
    socket.on("createdDay", (username) => {
      getDays(tripId).then((d) => mergeActivitiesIntoDays(d));

      if(user.username === username){
        toast.success("New day added successfully!");
      }
      else{
        toast.success(`New day added by ${username}!`);
      }
    });

    socket.on("updatedDay", (username) => {
      getDays(tripId).then((d) => mergeActivitiesIntoDays(d));

      if (user.username === username) {
        toast.success("Day moved successfully!");
      }
      else {
        toast.success(`Day moved by ${username}!`);
      }
    });

      socket.on("deletedDay", (username) => {
      getDays(tripId).then((d) => mergeActivitiesIntoDays(d));

      if(user.username === username){
        toast.success("Day deleted successfully!");
      }
      else{
        toast.success(`Day deleted by ${username}!`);
      }
    });

    socket.on("updatedActivity", (dayId, activityName, dayIndex, username, create) => {
      fetchDay(dayId);

      if(user.username === username){
        toast.success(create ? `Day ${dayIndex} activity "${activityName}" added!` : `Day ${dayIndex} activity "${activityName}" updated!`);
      }
      else{
        toast.success(create ? `Day ${dayIndex} activity "${activityName}" added by ${username}!` : `Day ${dayIndex} activity "${activityName}" updated by ${username}!`);
      }
    });

    socket.on("deletedActivity", (dayId, activityName, dayIndex, username) => {
      fetchDay(dayId);

      if(user.username === username){
        toast.success(`Day ${dayIndex} activity "${activityName}" deleted!`);
      }
      else{
        toast.success(`Day ${dayIndex} activity "${activityName}" deleted by ${username}!`);
      }
    });

    socket.on("noteUpdated", (dayId, activityName, dayIndex, username, notes) => {
      if(notes != ""){
        const toastNote = notes.length > 20 ? notes.slice(0, 20) + "..." : notes;
        fetchDay(dayId);

        if(user.username === username){
          toast.success(`Day ${dayIndex} activity "${activityName}" you note: "${toastNote}"`);
        }
        else{
          toast.success(`Day ${dayIndex} activity "${activityName}" ${username} notes: "${toastNote}"`);
        }
      }
    });

    socket.on("addedParticipant", (username) => {
      displayParticipants();
      toast.success(`Participant ${username} added!`);
    });

    socket.on("removedParticipant", (username) => {
      if(user.username === username){
        localStorage.setItem("removedToast", "You have been removed from this trip.");
        window.location.href = `${BASE_FRONTEND_URL}/trip`;
      }
      else{
        displayParticipants();
        toast.success(`Participant ${username} removed!`);
      }
    });

    socket.on("categoryApplied", (category) => {
      // update the trip state with the new category
      setTrip(prev => ({
        ...prev,
        trip_category: category
      }));

      toast.success("New trip category applied: " + category);
    });

    socket.on("addedTransport", (changedTransportType, username) => {
      fetchTransportInfo(changedTransportType);

      changedTransportType = changedTransportType.charAt(0).toUpperCase() + changedTransportType.slice(1);
      toast.success(`${changedTransportType} entry has been added by ${username}!`);
    });

    socket.on("updatedTransport", async (changedTransportType, username) => {
      fetchTransportInfo(changedTransportType);

      changedTransportType = changedTransportType.charAt(0).toUpperCase() + changedTransportType.slice(1);
      toast.success(`${changedTransportType} entry has been updated by ${username}!`);
    });

    socket.on("deletedTransport", (transportType, username, index) => {
      refreshTransportInfo();

      // Remove from current modal view
      setEntries(prev => {
        const updated = prev.filter((_, i) => i !== index);
        return updated;
      });

      transportType = transportType.charAt(0).toUpperCase() + transportType.slice(1);
      toast.success(`${transportType} entry has been deleted by ${username}!`);
    });

    socket.on("addedAccommodation", (changedAccommodationType, username) => {
      fetchAccommodationInfo();

      changedAccommodationType = changedAccommodationType.charAt(0).toUpperCase() + changedAccommodationType.slice(1);
      toast.success(`${changedAccommodationType} entry has been added by ${username}!`);
    });

    socket.on("updatedAccommodation", (changedAccommodationType, username) => {
      fetchAccommodationInfo();

      changedAccommodationType = changedAccommodationType.charAt(0).toUpperCase() + changedAccommodationType.slice(1);
      toast.success(`${changedAccommodationType} entry has been updated by ${username}!`);
    });

    socket.on("deletedAccommodation", (accommodationType, username, index) => {
      refreshAccommodationInfo();

      setEntries(prev => {
        const updated = prev.filter((_, i) => i !== index);
        return updated;
      });

      accommodationType = accommodationType.charAt(0).toUpperCase() + accommodationType.slice(1);
      toast.success(`${accommodationType} entry has been deleted by ${username}!`);
    });

    socket.on("disconnect", () => {
      // mark that socket disconnected
      socketDisconnectedRef.current = true;
    });

    return () => {
      socket.emit("leaveTrip", `trip_${tripId}`);
      socket.disconnect();
    };
  }, [tripId, user, userRole]);

  // refesh when user returns if socket was disconnected
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && socketDisconnectedRef.current) {
        // User came back AND socket was disconnected, show loader and reload
        setTimeout(() => {
          window.location.reload();
        }, 500); // small delay to show the loader so the user knows that we reconnected
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [aiHidden, setAiHidden] = useState(false);
  const [aiItems, setAIItems] = useState([]);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);

  const [aiDisabled, setAiDisabled] = useState(
    localStorage.getItem("planit:disablePackingAI") === "true"
  );


// If the setting changes (user toggles it in settings), refresh:
  useEffect(() => {
    const handler = () => {
      setAiDisabled(localStorage.getItem("planit:disablePackingAI") === "true");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    const update = () => {
      setShowAILabels(localStorage.getItem("planit:showAILabels") !== "false");
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);


  useEffect(() => {
    const saved = localStorage.getItem("planit:aiCollapsed");
    if (saved !== null) {
      setAiHidden(saved === "true");
    }
  }, []);

  const [hiddenLabels, setHiddenLabels] = useState(() => {
    const stored = localStorage.getItem("hiddenTripLabels");
    return stored ? JSON.parse(stored) : [];
  });

  // total cost across the entire trip (all days & activities)
  const totalTripCost = useMemo(() => {
    if (!Array.isArray(days)) return 0;

    return days.reduce((tripSum, day) => {
      const activities = day.activities || [];

      const daySum = activities.reduce((acc, activity) => {
        const rawCost = activity.activity_price_estimated ?? 0;
        const cost = Number(rawCost);
        return acc + (Number.isFinite(cost) ? cost : 0);
      }, 0);

      return tripSum + daySum;
    }, 0);
  }, [days]);

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
    
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
    }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    if (!tripId) return;
  
    const base =
      import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
  
    // Fetch transport data
    fetch(`${base}/transport/readTransportInfo?trip_id=${tripId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setTransportInfo(data.transportInfo || []))
      .catch((err) => console.error("Transport fetch error:", err));
  
    // Fetch accommodation data
    fetch(`${base}/transport/readAccommodationInfo?trip_id=${tripId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAccommodationInfo(data.accommodationInfo || []))
      .catch((err) => console.error("Accommodation fetch error:", err));
  }, [tripId]);

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
      const imageCacheKey = `image_${trip.image_id}_v1`;
      const cachedImageUrl = localStorage.getItem(imageCacheKey);

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
        localStorage.setItem(imageCacheKey, data);
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
              body: JSON.stringify({ dayId: day.day_id, canEdit }),
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

      const hasAnyActivityAddress = daysWithActivities.some(
        day => day.activities && day.activities[0]?.activity_address
      );

      if (trip && hasAnyActivityAddress && !weatherFetchedRef.current) {
        weatherFetchedRef.current = true;
        fetchAndSetWeather(daysWithActivities);
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
          body: JSON.stringify({dayId, canEdit})
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


      //const newIds = days.map(d => d.day_id);

      // if (!expandedInitRef.current) {
      //   // First load: mobile = collapsed, desktop = expanded
      //   setExpandedDays(window.innerWidth <= 600 ? [] : newIds);
      //   expandedInitRef.current = true;
      // } else {
      //   // Later fetches: keep prior choices, just drop deleted day IDs
      //   setExpandedDays(prev => prev.filter(id => newIds.includes(id)));
      // }
      setDays(prevDays => {
        const updatedDays = prevDays.map(d =>
          d.day_id === dayId ? { ...d, activities: sortedActivities } : d);

        // Find the day we just updated
        const targetDay = updatedDays.find(d => d.day_id === dayId);

        // If no activities remain for this day, remove its weather entry
        if (!targetDay || (targetDay.activities?.length ?? 0) === 0) {
          setDailyWeather(prevWeather =>
            prevWeather.filter(w => w.day_id !== dayId)
          );
        }

        fetchAndSetWeather(updatedDays);
        return updatedDays;
      });

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
      await createDay(tripId, { day_date: newDay, newDayInsertBefore}, user.username);

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

      await deleteDay(tripId, dayId, isFirstDay, user.username);

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
  const handleUpdateActivity = async (activityId, activity, dayId, dayIndex) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit activities");
      return;
    }

    try {
      const username = user.username;
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
            dayIndex,
            username
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

  const handleDeleteActivity = async (activityId, activityName, dayId, dayIndex, username) => {
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
          body: JSON.stringify({ tripId, activityId, activityName, dayId, dayIndex, username}),
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

  const updateNotesForActivity = async (id, newNote, dayId, activityName, dayIndex, username) => {
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
          dayId: dayId,
          activityName: activityName,
          dayIndex: dayIndex,
          username: username
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

        await updateDay(tripId, dragFromDay.day_id, { day_date: first.day_date , finalUpdate: true}, user.username);

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
      await updateDay(tripId, dragFromDay.day_id, { day_date: movedDayDate, finalUpdate: true }, user.username);

      setDragFromDay(null);
      setDragOverInfo({ dayId: null, index: null });
    } catch (error) {
      toast.error("Error reordering days: " + error.message);
    }
  }

  // add particpant to a trip
  const handleAddParticipant = async () => {
    // this number may change once we do some testing when deployed. i picked 7 because the owner is considered 1.
    const max_participants = 7;

    if (!canManageParticipants) {
      toast.error("Only the trip owner can add participants");
      return;
    }

    if (!participantUsername.trim()) return;

    if(participants.length >= max_participants){
      toast.error("Only 8 participants allowed per trip");
      return;
    }

    try {
      await addParticipant(trip.trips_id, participantUsername.trim());
      const data = await listParticipants(trip.trips_id);
      setParticipants(data.participants || []);
      setParticipantUsername("");
      setShowSuggestions(false);
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
      .filter((name) => name && typeof name === 'string')
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

  // Helper function used to refresh participant profiles
  const displayParticipants = async () => {
    listParticipants(tripId)
      .then(data => {
        setParticipants(data.participants || []);
      })
      .catch(err => {
        // Don't toast here, as it's a background load
        console.error("Failed to fetch participants for title display:", err);
      });
    getOwnerForTrip(tripId)
      .then(data => {
        setOwner(data.owner || []);
      })
      .catch(err => {
        console.error("Failed to fetch owner for title display:", err);
      });
  }

  useEffect(() => {
    if (trip?.trips_id && !isGuestUser(user?.user_id) && !isViewer) {
      displayParticipants();
    }
  }, [trip?.trips_id, isViewer]);

  const isGuestUser = (userId) => {
    return userId && userId.toString().startsWith('guest_');
  };

  const formatPrice = (num) => {
    const format = (value, suffix) => {
      const formatted = (value).toFixed(1);
      return formatted.endsWith(".0")
        ? Math.round(value) + suffix
        : formatted + suffix;
    };
    if (num >= 1_000_000) return format(num / 1_000_000, "M");
    if (num >= 1_000) return format(num / 1_000, "K");
    return num.toString();
  };

  const handlePackingAI = async () => {
    if (isPackingCooldown) return;

    if (isGuestUser(user?.user_id)) {
      toast.info("Please log in to use Packing AI.");
      return;
    }

    if (!days || days.length === 0) {
      toast.error("Packing AI needs days in the trip. Add days first.");
      return;
    }

    const startDate = new Date(trip.trip_start_date || days[0].day_date).toISOString().split("T")[0];
    const endDate   = new Date(days[days.length - 1].day_date).toISOString().split("T")[0];

    const tripDuration = getDifferenceBetweenDays(startDate, endDate);
    const activities = days.flatMap(day => day.activities || []);

    const allActivities = [];
    const allLocations = [];
    for (const activity of activities) {
      allActivities.push(activity.activity_types);
      allLocations.push(activity.activity_address);
    }

    const counts = new Map();
    for (const word of allLocations) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }

    let mostCommonLocation = null;
    let highestCount = 0;
    for (const [location, count] of counts.entries()) {
      if (count > highestCount) {
        highestCount = count;
        mostCommonLocation = location;
      }
    }
    if (!mostCommonLocation || !allActivities) {
      toast.warning("Packing AI needs at least one valid activity. Add an activity.");
      return;
    }

    if (!mostCommonLocation.includes(", US")) {
      toast.error(`Packing AI is offered for US trips only.`);
      return
    }

    const uniqueActivities = allActivities.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const tripPayload =         {
      "destination": mostCommonLocation.split(", US")[0],
      "season": weatherSummary.season,
      "activities": uniqueActivities.toString(),
      "duration_days": tripDuration,
      "avg_temp_high": weatherSummary.avg_high_f,
      "avg_temp_low": weatherSummary.avg_high_f,
      "avg_precipitation_chance": weatherSummary.avg_precipitation_chance,
      "humidity_percent": weatherSummary.avg_humidity
    }

    const requiredFields = [
      "season",
      "avg_temp_high",
      "avg_temp_low",
      "avg_precipitation_chance",
      "humidity_percent"
    ];

    for (const field of requiredFields) {
      const value = tripPayload[field];

      // Detect null, undefined, empty string, NaN
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        toast.warning(`Packing AI cannot process, weather not available.`);
        return;
      }
    }

    setIsPackingCooldown(true);
    try {
      const response = await retrievePackingItems(tripPayload);

      let items = [];

      // Our backend returns: { predicted_items: [...] }
      if (Array.isArray(response?.predicted_items)) {
        items = response.predicted_items.map((i) => i.item_name);
      }

      setAIItems(items);
      setShowAIPopup(true);

    } catch (e) {
      console.error("call failed", e);
      toast.error("Packing AI took too long to respond. Please try again later.");
    } finally {
      setTimeout(() => setIsPackingCooldown(false), 3000); // Cooldown: 3 seconds
    }
  };

  function getDifferenceBetweenDays (startDate, endDate) {
    const [y1, m1, d1] = startDate.split("-").map(Number);
    const [y2, m2, d2] = endDate.split("-").map(Number);

    const t1 = Date.UTC(y1, m1 - 1, d1);
    const t2 = Date.UTC(y2, m2 - 1, d2);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.round((t2 - t1) / MS_PER_DAY);
  }

  async function fetchAndSetWeather(sourceDays) {
    const actualDays = sourceDays && sourceDays.length ? sourceDays : days;

    const activityLocations = actualDays.map(day => day.activities[0]?.activity_address)
    const tripDaysDates = actualDays.map(day => day.day_date.split("T")[0]);
    const tripDaysKeys = actualDays.map(day => day.day_id);

    try {
      if (getDifferenceBetweenDays(new Date().toISOString().split("T")[0], tripDaysDates[0]) >= 365){
        toast.info("No weather forecast available, too far in the advance.")
        return;
      }

      const weather = await getWeather(
        activityLocations,
        tripDaysDates,
        tripDaysKeys
      );

      setWeatherSummary(weather.summary || []);
      setDailyWeather(weather.daily_raw || []);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load weather data");
    }
  }

  const handleSingleDayWeather = ({ dayId, date, weather }) => {
    const dayWeather = weather?.daily_raw?.[0];
    if (!dayWeather) return;

    const dateKey = date; // already "YYYY-MM-DD"

    setDailyWeather(prev => {
      // remove existing entry for this date (if any)
      const filtered = prev.filter(w => w.date !== dateKey);

      return [
        ...filtered,
        { ...dayWeather, day_id: dayId },
      ];
    });

    if (weather?.summary) {
      setWeatherSummary(prev => ({ ...prev, ...weather.summary }));
    }
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

  const openModalForType = async (type) => {
    const isAccommodation = type === "accommodation";
    const base = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
  
    setModalType(isAccommodation ? "accommodation" : "transport");
    setTransportType(isAccommodation ? null : type);
    transportTypeRef.current = isAccommodation ? null : type;
    setIsOpen(false);
  
    try {
      if (isAccommodation) {
        const res = await fetch(
          `${base}/transport/readAccommodationInfo?trip_id=${tripId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        const raw = data.accommodationInfo || [];
  
        // keep global state in sync
        setAccommodationInfo(raw);
  
        const mapped = raw.map((a) => ({
          accommodation_type: a.accommodation_type || "",
          accommodation_price: a.accommodation_price || "",
          accommodation_note: a.accommodation_note || "",
          accommodation_id: a.accommodation_id ?? null,
        }));
        const finalEntries = mapped.length > 0
          ? mapped
          : [{ accommodation_type: "", accommodation_price: "", accommodation_note: "" }];

        setEntries(finalEntries);
        setInitialEntries(JSON.parse(JSON.stringify(finalEntries)));
  
        setEntries(
          mapped.length > 0
            ? mapped
            : [{ accommodation_type: "", accommodation_price: "", accommodation_note: "" }]
        );
      } else {
        const res = await fetch(
          `${base}/transport/readTransportInfo?trip_id=${tripId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        const raw = data.transportInfo || [];
  
        // keep global state in sync
        setTransportInfo(raw);
  
        const mapped = raw
          .filter((t) => t.transport_type === type)
          .map((t) => ({
            ticketNumber: t.transport_number || "",
            price: t.transport_price || "",
            transport_id: t.transport_id ?? null,
            transport_note: t.transport_note || "",
          }));
        const finalEntries = mapped.length > 0
          ? mapped
          : [{ ticketNumber: "", price: "", transport_id: null, transport_note: "" }];

        setEntries(finalEntries);
        setInitialEntries(JSON.parse(JSON.stringify(finalEntries))); 
        setEntries(
          mapped.length > 0
            ? mapped
            : [{ ticketNumber: "", price: "", transport_id: null }]
        );
      }
  
      setShowModal(true);
    } catch (err) {
      console.error("Failed to open modal:", err);
      toast.error("Failed to load details.");
    }
  };

  // Called by listeners to fetch and update transport/entry states for all users
  const fetchTransportInfo = async (changedTransportType) => {
    // Fetch all transport info
    const res = await fetch(
      `${BASE_URL}/transport/readTransportInfo?trip_id=${tripId}`,
      { credentials: "include" }
    );
    const data = await res.json();
    const raw = data.transportInfo || [];

    setTransportInfo(raw);

    if (transportTypeRef.current !== changedTransportType) return;

    const mapped = raw
      .filter(t => t.transport_type === changedTransportType)
      .map(t => ({
        ticketNumber: t.transport_number || "",
        price: t.transport_price || "",
        transport_id: t.transport_id ?? null,
        transport_note: t.transport_note || "",
      }));

    const finalEntries = mapped.length > 0
      ? mapped
      : [{ ticketNumber: "", price: "", transport_id: null, transport_note: "" }];

    setEntries(finalEntries);
    setInitialEntries(JSON.parse(JSON.stringify(finalEntries)));
  }

  // Called by listeners to fetch and update accommodation/entry states for all users
  const fetchAccommodationInfo = async () => {
    // fetch accommodation info
    const res = await fetch(
      `${BASE_URL}/transport/readAccommodationInfo?trip_id=${tripId}`,
      { credentials: "include" }
    );
    const data = await res.json();
    const raw = data.accommodationInfo || [];

    // keep global state in sync
    setAccommodationInfo(raw);

    const mapped = raw.map((a) => ({
      accommodation_type: a.accommodation_type || "",
      accommodation_price: a.accommodation_price || "",
      accommodation_note: a.accommodation_note || "",
      accommodation_id: a.accommodation_id ?? null,
    }));
    const finalEntries = mapped.length > 0
      ? mapped
      : [{ accommodation_type: "", accommodation_price: "", accommodation_note: "" }];

    setEntries(finalEntries);
    setInitialEntries(JSON.parse(JSON.stringify(finalEntries)));

    setEntries(
      mapped.length > 0
        ? mapped
        : [{ accommodation_type: "", accommodation_price: "", accommodation_note: "" }]
    );
  }

  const handleSaveEntries = async () => {
    const base = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
    const entriesChanged = JSON.stringify(entries) !== JSON.stringify(initialEntries);
    if (!entriesChanged) {
      // Close modal silently without any toast
      setShowModal(false);
      return;
    }
    const invalidEntries = entries.filter(entry => {
      if (modalType === "transport") {

        const needsTicket = transportType === "flight" || transportType === "train";
        if (needsTicket) {
          return (entry.ticketNumber && !entry.price) || (!entry.ticketNumber && entry.price);
        } else {
          return false; 
        }
      } else {
        return (entry.accommodation_type && !entry.accommodation_price) || 
               (!entry.accommodation_type && entry.accommodation_price);
      }
    });
    
    if (invalidEntries.length > 0) {
      toast.error("Please fill in all required fields or leave entries completely empty");
      return;
    }
    
    const validEntries = entries.filter(entry => {
      if (modalType === "transport") {
        const needsTicket = transportType === "flight" || transportType === "train";
        if (needsTicket) {
          return entry.ticketNumber && entry.price;
        } else {
          return entry.price; 
        }
      } else {
        return entry.accommodation_type && entry.accommodation_price;
      }
    });
    
    if (validEntries.length === 0) {
      toast.warning("Please fill in at least one entry to save");
      return;
    }
    try{
      const originalById = {};
      for (const e of initialEntries) {
        const id = modalType === "transport" ? e.transport_id : e.accommodation_id;
        if (id) originalById[id] = e;
      }

      for (const entry of entries) {
        const id = modalType === "transport" ? entry.transport_id : entry.accommodation_id;

        const isUpdate = !!id;
        const original = id ? originalById[id] : null;

        const empty =
          (modalType === "transport" && !entry.ticketNumber && !entry.price) ||
          (modalType === "accommodation" && !entry.accommodation_type && !entry.accommodation_price);

        if (empty) continue;

        // Skip if entry has not changed
        if (isUpdate && original && JSON.stringify(entry) === JSON.stringify(original)) {
          continue;
        }

        const endpoint = modalType === "transport"
          ? (isUpdate ? "/transport/updateTransportInfo" : "/transport/addTransportInfo")
          : (isUpdate ? "/transport/updateAccommodationInfo" : "/transport/addAccommodationInfo");

        const method = isUpdate ? "PUT" : "POST";

        const body = modalType === "transport"
          ? {
            ...(isUpdate && { transport_id: entry.transport_id }),
            trip_id: tripId,
            transport_type: transportType,
            transport_price: entry.price,
            transport_note: entry.transport_note || null,
            transport_number: entry.ticketNumber,
            username: user.username
          }
        : {
            ...(isUpdate && { accommodation_id: entry.accommodation_id }),
            trip_id: tripId,
            accommodation_type: entry.accommodation_type,
            accommodation_price: entry.accommodation_price,
            accommodation_note: entry.accommodation_note || null,
            username: user.username
          };
  
        const response = await fetch(`${base}${endpoint}`, {
          method,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          if (err.error === "Profanity detected.") {
            toast.error("Profanity detected.");
            return;  // do NOT close modal
          }

          throw new Error(err.error || "Failed to save entry");
        }
    }
  
  
    setShowModal(false);
  } catch (error) {
    console.error("Error saving entries:", error);
    const errorMessage = modalType === "transport"
      ? "Failed to update transportation. Please try again."
      : "Failed to update accommodation. Please try again.";
    toast.error(errorMessage);
  }
  };

  const handleDeleteEntry = async (id, index, type) => {
    const base = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

  
    if (!id) {
      setEntries(prev => prev.filter((_, i) => i !== index));
      return;
    }
  
    const body =
      modalType === "transport"
        ? { transport_id: Number(id), trip_id: trip.trips_id, transport_type: type, username: user.username, index: index}
        : { accommodation_id: Number(id), trip_id: trip.trips_id, accommodation_type: type, username: user.username, index: index}; // normalize type
  
    const endpoint =
      modalType === "transport"
        ? "/transport/deleteTransportInfo"
        : "/transport/deleteAccommodationInfo";
    try {
      const res = await fetch(`${base}${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Delete failed");

    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete entry");
    }
  };
  
  
  const refreshAccommodationInfo = async () => {
    const base = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
    try {
      const res = await fetch(`${base}/transport/readAccommodationInfo?trip_id=${tripId}`, { 
        credentials: "include" 
      });
      const data = await res.json();
      setAccommodationInfo(data.accommodationInfo || []);
      return data.accommodationInfo || [];
    } catch (err) {
      console.error("Accommodation refresh error:", err);
      throw err;
    }
  };

  const refreshTransportInfo = async () => {
    const base = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
    try {
      const res = await fetch(`${base}/transport/readTransportInfo?trip_id=${tripId}`, { 
        credentials: "include" 
      });
      const data = await res.json();
      setTransportInfo(data.transportInfo || []);
      return data.transportInfo || [];
    } catch (err) {
      console.error("Transport refresh error:", err);
      throw err;
    }
  };
  
  return (
    <div className="page-layout">
      <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>

      <div className="content-with-sidebar">
        <NavBar userId={user.user_id} isGuest={isGuestUser(user?.user_id)}/>
        <main className={`TripDaysPage ${openActivitySearch ? "drawer-open" : ""}`}>
          <div className="title-div">
          <div className = "title-left">
  <h1 className="trip-title">{trip.trip_name}</h1>
            {showAILabels &&
                trip.trip_category &&
                !hiddenLabels.includes(trip.trips_id) && (
                    <Label category={trip.trip_category} />
                )}

          </div>

            <div className="title-action-row">
              {isViewer && (
                <div className="permission-badge viewer-badge">
                  <Eye className="view-icon" />
                  <span>Viewing Only</span>
                </div>
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
                        onClick={() => setShowAllParticipantsPopup(true)}
                      />
                    ) : (
                      <div
                        key={`${p.user_id || ''}-${p.username}`}
                        className="participant-pfp placeholder"
                        title={p.username}
                        onClick={() => setShowAllParticipantsPopup(true)}
                      >
                        {p.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )
                  )}

                  {hiddenCount > 0 && (
                    <div
                      className="participant-pfp placeholder remainder"
                      title={hiddenUsernamesString}
                      onClick={() => setShowAllParticipantsPopup(true)}
                    >
                      +{hiddenCount}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="trip-info">

            <div className="trip-left-side">
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
                    {new Date(days[days.length - 1].day_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="clone-trip-wrapper">
              <CloneTripButton
                user={user}
                tripId={tripId}
                access={userRole}
                fromExplore={fromExplore}
                onCloned={(newId) => navigate(`/days/${newId}`)}
                trip={trip}
              />
            </div>
          </div>

          <div className="image-banner">
            <img
              src={imageUrl}
              alt={trip.trip_name}
              id={`image${trip.image_id}`}
            />
          </div>
          <div className="button-level-bar">
            {canEdit && (
          <div className="transportation-dropdown-wrapper" ref={dropdownRef}>
            <div className="transport-and-accommodation-buttons">
              <button className="circle-icon-btn" onClick={toggleDropdown}>
                <Plane width={16} height={16} />
              </button>
              <button
                className="circle-icon-btn"
                onClick={() => openModalForType("accommodation")}
              >
                <Bed width={16} height={16} />
              </button>
              </div>
              {isOpen && (
                <div className="transportation-dropdown">
                  <ul>
                    <li
                      onClick={() => openModalForType("flight")}
                      className={transportInfo.some(t => t.transport_type === "flight") ? "has-entry" : ""}
                    >
                      <Plane size={20} />
                      <span>Flight</span>
                      {transportInfo.some(t => t.transport_type === "flight") && (
                        <span className="entry-count">
                          {transportInfo.filter(t => t.transport_type === "flight").length}
                        </span>
                      )}
                    </li>
                    <li
                      onClick={() => openModalForType("car")}
                      className={transportInfo.some(t => t.transport_type === "car") ? "has-entry" : ""}
                    >
                      <Car size={20} />
                      <span>Car</span>
                      {transportInfo.some(t => t.transport_type === "car") && (
                        <span className="entry-count">
                          {transportInfo.filter(t => t.transport_type === "car").length}
                        </span>
                      )}
                    </li>
                    <li
                      onClick={() => openModalForType("train")}
                      className={transportInfo.some(t => t.transport_type === "train") ? "has-entry" : ""}
                    >
                      <Train size={20} />
                      <span>Train</span>
                      {transportInfo.some(t => t.transport_type === "train") && (
                        <span className="entry-count">
                          {transportInfo.filter(t => t.transport_type === "train").length}
                        </span>
                      )}
                    </li>
                    <li
                      onClick={() => openModalForType("bus")}
                      className={transportInfo.some(t => t.transport_type === "bus") ? "has-entry" : ""}
                    >
                      <Bus size={20} />
                      <span>Bus</span>
                      {transportInfo.some(t => t.transport_type === "bus") && (
                        <span className="entry-count">
                          {transportInfo.filter(t => t.transport_type === "bus").length}
                        </span>
                      )}
                    </li>
                    <li
                      onClick={() => openModalForType("boat")}
                      className={transportInfo.some(t => t.transport_type === "boat") ? "has-entry" : ""}
                    >
                      <Ship size={20} />
                      <span>Boat</span>
                      {transportInfo.some(t => t.transport_type === "boat") && (
                        <span className="entry-count">
                          {transportInfo.filter(t => t.transport_type === "boat").length}
                        </span>
                      )}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            )}
              {showModal && (
                <Popup
                  title={modalType === "accommodation" ? "Accommodation Details" : `${transportType?.charAt(0).toUpperCase() + transportType?.slice(1)} Details`}
                  onClose={() => setShowModal(false)}
                  buttons={
                    <>
                      <button onClick={() => setShowModal(false)}>
                        Cancel
                      </button>
                      <button className="btn-rightside" onClick={handleSaveEntries}>
                        Save Details
                      </button>
                    </>
                  }
                >
                  <div className="modal-body">
                    {entries.map((entry, index) => (
                      <div key={index} className="entry-block">
                        {modalType === "transport" && (
                          <>
                            <button 
                              className="delete-entry-btn" 
                              onClick={() => handleDeleteEntry(
                                entry.transport_id, 
                                index,
                                transportType
                              )}
                              title="Delete this entry"
                            >
                              <Trash2 size={18} />
                            </button>
                            {(transportType === "flight" || transportType === "train") && (
                              <>
                                <label>{transportType === "flight" ? "Flight Number" : "Ticket Number"}</label>
                                <input
                                  type="text"
                                  value={entry.ticketNumber ?? ""}
                                  onChange={(e) => {
                                    const copy = [...entries];
                                    copy[index].ticketNumber = e.target.value;
                                    setEntries(copy);
                                  }}
                                  placeholder="e.g. AA1234"
                                />
                              </>
                            )}
              
                            <label>Price ($)</label>
                            <input
                              type="text"            
                              inputMode="numeric"       
                              value={entry.price ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;

                                const cleaned = raw.replace(/[^0-9]/g, "");

                                const copy = [...entries];
                                copy[index].price = cleaned;
                                setEntries(copy);
                              }}
                              placeholder="e.g. 10"
                            />
              
                            <label>Notes</label>
                            <textarea
                              value={entry.transport_note ?? ""}
                              onChange={(e) => {
                                const copy = [...entries];
                                copy[index].transport_note = e.target.value;
                                setEntries(copy);
                              }}
                              placeholder="Enter any notes about your transportation"
                              maxLength={200}
                            />
                            <div className="char-count">
                              {(entry.transport_note || "").length} / 200
                            </div>
                          </>
                        )}
              
                        {modalType === "accommodation" && (
                          <>
                            <button 
                              className="delete-entry-btn" 
                              onClick={() => handleDeleteEntry(
                                entry.accommodation_id, 
                                index,
                                entry.accommodation_type
                              )}
                              title="Delete this entry"
                            >
                              <Trash2 size={18} />
                            </button>
              
                            <label>Accommodation Type</label>
                            <input
                              value={entry.accommodation_type ?? ""}
                              onChange={(e) => {
                                const copy = [...entries];
                                copy[index].accommodation_type = e.target.value;
                                setEntries(copy);
                              }}
                              placeholder="e.g., Hotel, Airbnb, Resort"
                            />
                            <label>Price ($)</label>
                            <input
                              type="text"            
                              inputMode="numeric"       
                              value={entry.accommodation_price ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;

                                const cleaned = raw.replace(/[^0-9]/g, "");

                                const copy = [...entries];
                                copy[index].accommodation_price = cleaned;
                                setEntries(copy);
                              }}
                              placeholder="e.g. 10"
                            />
              
                            <label>Notes</label>
                            <textarea
                              value={entry.accommodation_note ?? ""}
                              onChange={(e) => {
                                const copy = [...entries];
                                copy[index].accommodation_note = e.target.value;
                                setEntries(copy);
                              }}
                              placeholder="Enter any notes about your accommodation"
                              maxLength={200}
                            />
                            <div className="char-count">
                              {(entry.accommodation_note || "").length} / 200
                            </div>
                          </>
                        )}
                      </div>
                    ))}
              
                    <button
                      className="modal-add"
                      onClick={() =>
                        setEntries([
                          ...entries,
                          modalType === "accommodation"
                            ? { accommodation_type: "", accommodation_price: "", accommodation_note: "" }
                            : { ticketNumber: "", price: "", transport_note: "" },
                        ])
                      }
                    >
                      + Add Another Entry
                    </button>
                  </div>
                </Popup>
              )}
            <h1 className="itinerary-text">Itinerary</h1>
            {days.length > 0 && (
              <div className="trip-cost trip-cost-itinerary">
                <PiggyBank className="trip-info-icon trip-cost-icon"/>
                <span className="trip-cost-label">Total Cost:</span>
                <span className="trip-cost-value">
                  ${formatPrice(totalTripCost)}
                </span>
              </div>
            )}
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
          {!aiDisabled && (
            <div className="ai-floating-container">
              <button
                className={`ai-expand-btn ${aiExpanded ? "expanded" : ""} ${isPackingCooldown ? "cooldown" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // If collapsed -> expand
                  if (!aiExpanded) {
                    setAiExpanded(true);
                    return;
                  }

                  // If expanded -> check what was clicked
                  const target = e.target;
                  const clickedOnChevron = target.classList.contains('collapse-chevron') || target.closest('.collapse-chevron');

                  if (clickedOnChevron) {
                    // Only chevron collapses
                    setAiExpanded(false);
                  } else {
                    // Everything else (icon, label, background) triggers AI
                    handlePackingAI();
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (!aiExpanded) {
                    setAiExpanded(true);
                    return;
                  }

                  const target = e.target;
                  const clickedOnChevron = target.classList.contains('collapse-chevron') || target.closest('.collapse-chevron');

                  if (clickedOnChevron) {
                    setAiExpanded(false);
                  } else {
                    handlePackingAI();
                  }
                }}
                disabled={isPackingCooldown}
              >
                <Luggage className="ai-icon" />

                <span className="label">
                   Packing AI
                </span>

                {aiExpanded && (
                  <ChevronRight className="collapse-chevron" />
                )}
              </button>
            </div>
          )}
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
                  const weatherForDay = dailyWeather.find(w => w.day_id === day.day_id);
                  const dayTotal = (day.activities || []).reduce((sum, activity) => {
                    const rawCost = activity.activity_price_estimated ?? 0;
                    const cost = Number(rawCost);
                    return sum + (Number.isFinite(cost) ? cost : 0);
                  }, 0);
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
                          <div className="title-and-weather-container">
                            <p className="day-title">Day {index + 1}</p>
                            <div className="weather-icon">
                              {weatherForDay && (
                                <div className="weather-menu">
                                  <div>
                                    <p>High: {Math.round(weatherForDay.max_temp_f)}°F</p>
                                    <p>Low: {Math.round(weatherForDay.min_temp_f)}°F</p>
                                    <p>Prec: {Math.round(weatherForDay.avg_precipitation_chance)}%</p>
                                  </div>
                                </div>
                              )}
                              {weatherForDay?.condition_icon ? (
                                <img
                                  className = "weather-icon"
                                  src={`https://${weatherForDay.condition_icon}`}
                                  alt="Weather icon"
                                  draggable="false"
                                />
                              ) : (
                                <div className="empty-weather-icon" />
                              )}
                            </div>
                          </div>

                          <div className="day-top-row-header">
                            <div className="day-date-and-weather">
                              <p className="day-date">
                                {new Date(day.day_date).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>

                            </div>

                            <div className="day-cost">
                              <span className="day-cost-currency">$</span>
                              <span className="day-cost-value">{formatPrice(dayTotal)}</span>
                            </div>
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
          {showAIPopup && (
            <Popup
              title="Don't forget these items..."
              onClose={() => setShowAIPopup(false)}
              buttons={
                <>
                  <button onClick={() => setShowAIPopup(false)}>Close</button>
                </>
              }
            >
              {aiItems.length === 0 ? (
                <p className="empty-state-text">No items were returned.</p>
              ) : (
                <ul className="ai-items-list">
                  {aiItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </Popup>
          )}
          {showAllParticipantsPopup && (
            <Popup
              title = "All Trip Participants"
              onClose={() => setShowAllParticipantsPopup(false)}
              buttons={
                <button onClick={() => setShowAllParticipantsPopup(false)}>
                  Close
                </button>
              }
            >
              <div className="all-participants-container">
                {orderedPeople.map((person) => (
                  <div key={person.user_id} className="individual-participant">
                    <img
                      className={`participant-pfp ${isUserActive(person.username) ? 'active' : ''}`}
                      src={person.photo}
                      alt={person.username}
                    />
                    <span className = "participant-username">{person.username}</span>
                    {isUserActive(person.username) && (
                      <span className="is-active">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Popup>
          )}
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
                        updateNotesForActivity(selectedActivity.activity_id, editableNote, selectedActivity.day_id, selectedActivity.activity_name, days.findIndex(d => d.day_id === selectedActivity.day_id) + 1, user.username);
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
                      handleDeleteActivity(deleteActivity.activity_id, deleteActivity.activity_name, deleteActivity.day_id, days.findIndex(d => d.day_id === deleteActivity.day_id) + 1, user.username);
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
              id="editActivityPopup"
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
                        editActivity.day_id,
                        days.findIndex(d => d.day_id === editActivity.day_id) + 1
                      );
                    }}
                  >
                    Save
                  </button>
                </>
              }
            >
              <span className="activity-name">{editActivity.activity_name}</span>
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
                  min = "0"
                  max = "1440"
                  value={editDuration}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) =>{
                    const val = e.target.value;
                    if(val == '') setEditDuration('');
                    else setEditDuration(Math.min(1440, Math.max(0,val)));
                  }
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
                  min = "0"
                  max = "10000000"
                  step = "1"
                  value={editCost}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if(val == '') setEditCost('');
                    else setEditCost(Math.min(10000000, Math.max(0,Math.floor(val))));
                  }}
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
              <div className = "count-of-participants">{participants.length + 1} / 8 participants</div>
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
              allDays={days}
              username = {user.username}
              onSingleDayWeather={handleSingleDayWeather}
              onEditActivity={(activity) => {
                setEditActivity(activity);
              }}
              cityQuery={activitySearchCity}
              onCityQueryChange={setActivitySearchCity}
            />
          </div>
        )}
      </div>
    </div>
  );
}
