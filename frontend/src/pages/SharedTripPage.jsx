import React, { useState, useEffect, useRef, useMemo } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import Popup from "../components/Popup";
import "../css/Popup.css";
import {Calendar, MapPin, Pencil, Trash2, UserPlus, X} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MoonLoader } from "react-spinners";
import { getSharedTrips } from "../../api/trips";
import "react-datepicker/dist/react-datepicker.css";
import GuestEmptyState from "../components/GuestEmptyState";
import { toast } from "react-toastify";
import TripsFilterButton from "../components/TripsFilterButton";
import Label from "../components/Label.jsx";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const [openRemoveYourselfPopup, setOpenRemoveYourselfPopup] = useState(false);
    const [selectedTripToRemove, setSelectedTripToRemove] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // images for trip cards
    const [imageUrls, setImageUrls] = useState({})

    // persist sort / filter choices for shared trips
    const [sortOption, setSortOption] = useState(() => {
        if (typeof window === "undefined") return "recent";
        return localStorage.getItem("sharedTripsSortOption") || "recent";
    });
    const [dateFilter, setDateFilter] = useState(() => {
        if (typeof window === "undefined") return "all";
        return localStorage.getItem("sharedTripsDateFilter") || "all";
    });
    const [categoryFilter, setCategoryFilter] = useState("all");

    const [hiddenLabels, setHiddenLabels] = useState(() => {
        const stored = localStorage.getItem("hiddenTripLabels");
        return stored ? JSON.parse(stored) : [];
    });

    const [showAILabels, setShowAILabels] = useState(
        localStorage.getItem("planit:showAILabels") !== "false"
    );

    // Get user details
    useEffect(() => {
        fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
            "/auth/login/details",
            { credentials: "include" }
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.loggedIn === false) return;
                setUser({ ...data });
            })
            .catch((err) => console.error("User fetch error:", err));
    }, []);

    // Fetch trips once user is loaded
    useEffect(() => {
        if (!user?.user_id || isGuestUser(user.user_id)) return;

        getSharedTrips(user.user_id)
            .then((data) => {
                const tripsArray = Array.isArray(data) ? data : data.trips;
                setTrips(data.sharedTrips.sort((a, b) => a.trips_id - b.trips_id));
            })
            .catch((err) => console.error("Failed to fetch trips:", err));
    }, [user?.user_id]);

    const handleTripRedirect = (tripId) => {
        navigate(`/days/${tripId}`);
    };

    useEffect(() => {
        const update = () => {
            setShowAILabels(localStorage.getItem("planit:showAILabels") !== "false");
        };
        window.addEventListener("storage", update);
        return () => window.removeEventListener("storage", update);
    }, []);


    useEffect(() => {
        if (!trips || trips.length === 0) return;

        const fetchImages = async () => {
            const newImageUrls = {};

            for (const trip of trips) {
                if (!trip.image_id || trip.image_id === 0) continue;

                // Check if the image URL is already in localStorage global cache
                const cachedImageUrl = localStorage.getItem(`image_${trip.image_id}`);

                // If the image is cached, use it
                if (cachedImageUrl) {
                    newImageUrls[trip.trips_id] = cachedImageUrl;
                    continue;
                }

                try {
                    const res = await fetch(
                        `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/image/readone?imageId=${trip.image_id}`,
                        { credentials: "include" }
                    );

                    const data = await res.json();
                    localStorage.setItem(`image_${trip.image_id}`, data);
                    newImageUrls[trip.trips_id] = data;
                } catch (err) {
                    console.error(`Error fetching image for trip ${trip.trips_id}:`, err);
                }
            }
            // Merge new image URLs with existing ones
            setImageUrls((prev) => ({...prev, ...newImageUrls}));
        };

        fetchImages();
    }, [trips]);

    // persist filter/sort selections for this page
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (sortOption) {
            localStorage.setItem("sharedTripsSortOption", sortOption);
        } else {
            localStorage.removeItem("sharedTripsSortOption");
        }
    }, [sortOption]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (dateFilter) {
            localStorage.setItem("sharedTripsDateFilter", dateFilter);
        } else {
            localStorage.removeItem("sharedTripsDateFilter");
        }
    }, [dateFilter]);

    useEffect(() => {
        if(user === null || isGuestUser(user?.user_id)) return;
        const cachedUnseen = `hasUnseen_${user.user_id}`;
        async function markSeen() {await fetch(`${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/shared/markTrips`, {
                method: "PUT",
                credentials: "include"
            });
            localStorage.setItem(cachedUnseen, "false");
            window.dispatchEvent(new Event("unseenTripsCleared"));
        }
        markSeen();
    }, [user]);

    const sortedFilteredTrips = useMemo(() => {
        if (!Array.isArray(trips)) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let result = [...trips];

        // filter by category
        if (categoryFilter !== "all") {
            result = result.filter(
                (trip) =>
                    (trip.trip_category || "").toLowerCase() ===
                    categoryFilter.toLowerCase()
            );
        }

        // filter: All / Upcoming & in-progress / Past
        result = result.filter((trip) => {
            const start = trip.trip_start_date ? new Date(trip.trip_start_date) : null;
            const end = trip.trip_end_date ? new Date(trip.trip_end_date) : null;

            const isPast =
              (end && end < today) ||
              (!end && start && start < today);

            if (dateFilter === "upcoming") {
                return !isPast;
            }

            if (dateFilter === "past") {
                return isPast;
            }

            return true; // "all"
        });

        // sort
        result.sort((a, b) => {
            // sort by name
            if (sortOption === "az" || sortOption === "za") {
                const nameA = (a.trip_name || "").toLowerCase();
                const nameB = (b.trip_name || "").toLowerCase();
                const cmp = nameA.localeCompare(nameB);
                return sortOption === "az" ? cmp : -cmp;
            }

            // sort by location
            if (sortOption === "location") {
                const locA = (a.trip_location || "").toLowerCase();
                const locB = (b.trip_location || "").toLowerCase();
                return locA.localeCompare(locB);
            }

            const getDateForSort = (trip) => {
                // "recent" prefers updated_at if present
                if (sortOption === "recent" && (trip.trip_updated_at)) {
                    return new Date(trip.trip_updated_at);
                }
                if (trip.trip_start_date) return new Date(trip.trip_start_date);
                if (trip.trip_end_date) return new Date(trip.trip_end_date);
                if (trip.trip_updated_at) {
                    return new Date(trip.trip_updated_at);
                }
                return null;
            };

            const dateA = getDateForSort(a);
            const dateB = getDateForSort(b);

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            if (sortOption === "earliest") {
                return dateA - dateB;
            }

            if (sortOption === "oldest") {
                return dateB - dateA;
            }

            if (sortOption === "recent") {
                return dateB - dateA;
            }

            return dateA - dateB;
        });

        return result;
    }, [trips, sortOption, dateFilter, categoryFilter]);

    const isGuestUser = (userId) => {
        return userId && userId.toString().startsWith('guest_');
    };

    async function handleRemovingFromTrip() {
        if(!selectedTripToRemove) return;
        try{
            setIsLoading(true);
            const results = await fetch(`${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/shared/removeYourself`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ userId : user.user_id, tripId : selectedTripToRemove.trips_id })
                }
            );

            setTrips(prev =>
                prev.filter(t => t.trips_id !== selectedTripToRemove.trips_id)
            );

            setSelectedTripToRemove(null);

            toast.success("You removed yourself successfully!")
        } catch (err){
            toast.error("There was a problem removing yourself from this trip")
        } finally {
            setIsLoading(false);
        }
    }

    //Show Loader while fetching user or trips
    if (!user || !trips) {
        return (
            <div className="trip-page">
                <TopBanner user={user} isGuest={isGuestUser(user?.user_id)} />
                <div className="content-with-sidebar">
                    <NavBar />
                    <div className="main-content">
                        <div className="page-loading-container">
                            <MoonLoader color="var(--accent)" size={70} speedMultiplier={0.9} data-testid="loader" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if(isLoading){
        return(
        <div className="main-content">
            <div className="page-loading-container">
                <MoonLoader color="var(--accent)" size={70} />
            </div>
        </div>
        );
    }

    // guest empty state if user is a guest
    if (isGuestUser(user?.user_id)) {
        return (
            <div className="trip-page">
                <TopBanner user={user} isGuest={isGuestUser(user?.user_id)} />
                <div className="content-with-sidebar">
                    <NavBar />
                    <div className="main-content">
                        <GuestEmptyState title="Hi, Guest" description="You're currently browsing as a Guest. Sign in to create and share trips with family and friends!" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="trip-page">
            <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>
            <div className="content-with-sidebar">
                <NavBar userId={user.user_id} isGuest={isGuestUser(user?.user_id)}/>
                <div className="main-content">
                    <div className="trips-section">
                        {/* Header row */}
                        <div className="trips-header">
                            <div className="trips-title-section">
                                <div className="trips-title">
                                    {user
                                        ? `Shared With ${user.username ? user.username : user.first_name}`
                                        : <MoonLoader color="var(--accent)" size={30} />}
                                </div>
                                <div className="trips-subtitle">
                                    Trips that have been shared with you
                                </div>
                            </div>

                            <div className="banner-controls">
                                <TripsFilterButton
                                    sortOption={sortOption}
                                    setSortOption={setSortOption}
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                    categoryFilter={categoryFilter}
                                    setCategoryFilter={setCategoryFilter}
                                />
                            </div>
                        </div>

                        {/* Trip cards */}
                        <div className="trip-cards">
                            {sortedFilteredTrips.length === 0 ? (
                                <div className="empty-state">
                                    {trips.length == 0 ? (
                                        <>
                                            <h3>No trips have been shared with you yet!</h3>
                                            <div>
                                                {user
                                                    ? `${user.username}, no trips have been shared with you yet.`
                                                    : <MoonLoader color="var(--accent)" size={25} />}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h3>No trips match your filters</h3>
                                            <div>Try adjusting your filters to see more trips</div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                sortedFilteredTrips.map((trip) => (
                                    <div key={trip.trips_id} className="trip-card">
                                        <div className="trip-card-image"
                                            onClick={() => handleTripRedirect(trip.trips_id)}>
                                            <img
                                                src={imageUrls[trip.trips_id]}
                                                alt={trip.trip_name}
                                                className="trip-card-img"
                                            />
                                        </div>
                                        <button className="remove-yourself-from-trip-btn"
                                            onClick = {() => {
                                                setSelectedTripToRemove(trip);
                                                setOpenRemoveYourselfPopup(true);
                                            }}>
                                            <Trash2 size={16} />
                                        </button>
                                        {openDropdownId === trip.trips_id && (
                                            <div className="trip-dropdown" ref={dropdownRef}>
                                            </div>
                                        )}

                                        <div
                                            className="trip-card-content"
                                            onClick={() => handleTripRedirect(trip.trips_id)}
                                        >
                                            <div className="trip-card-title-row">
                                                <h3 className="trip-card-title">{trip.trip_name}</h3>

                                                {/* Show label ONLY if category exists AND it's not marked hidden */}
                                                {showAILabels &&
                                                    trip.trip_category &&
                                                    !hiddenLabels.includes(trip.trips_id) && (
                                                        <Label category={trip.trip_category} />
                                                    )}
                                            </div>

                                            <div className="trip-card-footer">
                                                <div className="trip-location">
                                                    <MapPin size={16} style={{marginRight: "4px"}}/>
                                                    {trip.trip_location || "Location not set"}
                                                </div>

                                                <p className="trip-date">
                                                    {trip.trip_start_date && (
                                                        <span className="trip-date">
                                              <Calendar size={16} />
                                                            {new Date(trip.trip_start_date).toLocaleDateString()}
                                          </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {openRemoveYourselfPopup && selectedTripToRemove &&  (
                <Popup
                    title={`Remove Yourself from ${selectedTripToRemove.trip_name}`}
                    onClose={() => setOpenRemoveYourselfPopup(false)}
                    buttons={
                        <>
                            <button
                                type="button"
                                onClick={() => setOpenRemoveYourselfPopup(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-rightside"
                                onClick={() => {
                                    handleRemovingFromTrip();
                                    setOpenRemoveYourselfPopup(false);
                                }}
                            >
                                Remove
                            </button>
                        </>
                    }
                >
                    <p className="popup-body-text">
                        Are you sure you want to remove yourself from this trip? You will no longer have access to edit this trip.
                    </p>
                </Popup>
            )}
        </div>
    );
}