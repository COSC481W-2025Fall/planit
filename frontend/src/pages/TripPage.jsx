import React, { useState, useEffect } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);

    // Fetch user details on load
    useEffect(() => {
        fetch("http://localhost:3000/auth/login/details", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                if (data.loggedIn === false) return;
                setUser(data);
            });
    }, []);

    // Fetch trips
    useEffect(() => {
        fetch("http://localhost:3000/auth/user/trips", { credentials: "include" })
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
        <div className="trip_page">
            {/* Top banner */}
            <TopBanner
                user={user}
                onSignOut={() => {
                    window.location.href = "/";
                }}
            />

            <div className="main_content">
                {/* Left sidebar NavBar */}
                <NavBar />

                {/* Main trips content */}
                <div className="my_trips">
                    <div className="my_trips_banner">
                        <div className="trips_title">
                            {user.first_name} {user.last_name}'s Trips
                        </div>
                        <button className="new_trip_button">New Trip</button>
                        <button className="sort_button">Sort</button>
                    </div>

                    <div className="trip_cards">
                        {trips.length === 0 ? (
                            <div>
                                {user.first_name}, you haven't created any trips! PlanIt now!
                            </div>
                        ) : (
                            trips.map((trip) => (
                                <div key={trip.id} className="trip_card">
                                    <div className="trip_card_title">{trip.name}</div>
                                    <div className="trip_card_days">{trip.days} days</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
