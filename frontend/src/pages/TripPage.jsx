import React, { useState, useEffect } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);

// run this code when the component first loads
useEffect(() => {
  // make a request to the backend and include cookies for authentication
  fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/login/details", { credentials: "include" })
    .then((res) => res.json())

    // convert the server response into a javascript object
    .then((data) => {
      // once the data is ready, check if the user is logged in

      // if not logged in, stop here and do nothing
      if (data.loggedIn === false) return;

      // if logged in, save user info in state so the component can use it
      setUser(data);
    });
}, []);
// the empty array means this effect only runs once when the component loads


useEffect(() => {
  fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/user/trips", { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      if (data.loggedIn === false) return;
      setTrips(data.trips);
    })
    .catch(err => console.log("Failed to fetch trips:", err));
}, []);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="trip_page">
            <TopBanner
                user={user}
                onSignOut={() => {
                    window.location.href = "/";
                }}
            />

            <div className="main_content">
                <NavBar />

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