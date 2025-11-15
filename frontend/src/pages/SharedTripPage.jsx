import React, { useState, useEffect, useRef } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import Popup from "../components/Popup";
import "../css/Popup.css";
import { MapPin, Pencil, Trash, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MoonLoader } from "react-spinners";
import { getSharedTrips } from "../../api/trips";
import "react-datepicker/dist/react-datepicker.css";
import GuestEmptyState from "../components/GuestEmptyState";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // images for trip cards
    const [imageUrls, setImageUrls] = useState({})

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

    const isGuestUser = (userId) => {
        return userId && userId.toString().startsWith('guest_');
    };

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
                <NavBar />
                <div className="main-content">
                    <div className="trips-section">
                        {/* Header row */}
                        <div className="trips-header">
                            <div className="trips-title-section">
                                <div className="trips-title">
                                    {user
                                        ? `Shared With ${user.first_name} ${user.last_name}`
                                        : <MoonLoader color="var(--accent)" size={30} />}
                                </div>
                                <div className="trips-subtitle">
                                    Trips that have been shared with you
                                </div>
                            </div>

                            <div className="banner-controls">
                                <button className="filter-button">
                                    <span className="filter-icon"></span> Filter
                                </button>
                            </div>
                        </div>

                        {/* Trip cards */}
                        <div className="trip-cards">
                            {trips.length === 0 ? (
                                <div className="empty-state">
                                    <h3>No trips have been shared with you yet!</h3>
                                    <div>
                                        {user
                                            ? `${user.first_name}, no trips have been shared with you yet.`
                                            : <MoonLoader color="var(--accent)" size={25} />}
                                    </div>
                                </div>
                            ) : (
                                trips.map((trip) => (
                                    <div key={trip.trips_id} className="trip-card">
                                        <div className="trip-card-image"
                                            onClick={() => handleTripRedirect(trip.trips_id)}>
                                            <img
                                                src={imageUrls[trip.trips_id]}
                                                alt={trip.trip_name}
                                                className="trip-card-img"
                                            />
                                        </div>
                                        {openDropdownId === trip.trips_id && (
                                            <div className="trip-dropdown" ref={dropdownRef}>
                                            </div>
                                        )}

                                        <div
                                            className="trip-card-content"
                                            onClick={() => handleTripRedirect(trip.trips_id)}
                                        >
                                            <h3 className="trip-card-title">{trip.trip_name}</h3>
                                            <div className="trip-location">
                                                <MapPin size={16} style={{ marginRight: "4px" }} />
                                                {trip.trip_location || "Location not set"}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}