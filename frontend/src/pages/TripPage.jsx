import React, { useState, useEffect } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);

    // run this code when the component first loads
    useEffect(() => {
        fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/login/details",
            { credentials: "include" }
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.loggedIn === false) return;
                setUser(data);
            });
    }, []);

    useEffect(() => {
        fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/user/trips",
            { credentials: "include" }
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.loggedIn === false) return;
                setTrips(data.trips);
            })
            .catch((err) => console.log("Failed to fetch trips:", err));
    }, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="trip-page">
            <TopBanner
                user={user}
                onSignOut={() => {
                    window.location.href = "/";
                }}
            />

            <div className="main-content">
                <NavBar />

                <div className="my-trips">
                    <div className="my-trips-banner">
                        <div className="trips-title">
                            {user.first_name} {user.last_name}'s Trips
                        </div>
                        <button className="new-trip-button">New Trip</button>
                        <button className="sort-button">Sort</button>
                    </div>

                    <div className="trip-cards">
                        {trips.length === 0 ? (
                            <div>
                                {user.first_name}, you haven't created any trips! PlanIt now!
                            </div>
                        ) : (
                            trips.map((trip) => (
                                <div key={trip.id} className="trip-card">
                                    <div className="trip-card-title">{trip.name}</div>
                                    <div className="trip-card-days">{trip.days} days</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
