import React from "react";
import "../css/TripPage.css";
import { useState } from "react";
import { useEffect } from "react";

export default function TripPage() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);

// run this code when the component first loads
useEffect(() => {
  // make a request to the backend and include cookies for authentication
  fetch("http://localhost:3000/auth/login/details", { credentials: "include" })
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
  fetch("http://localhost:3000/auth/user/trips", { credentials: "include" })
    .then((res) => res.json())
    .then((data) => {
      if (data.loggedIn === false) return;
      setTrips(data.trips);
    })
    .catch(err => console.log("Failed to fetch trips:", err));
}, []); 



  // FRONTEND TEAM - MAKE A CUSTOM LOADER OR SOMETHING
  if (!user) 
  {
    return <div>Loading...</div>;
  }

  return (
    <div className="trip_page">
        <div className="top_banner">
          <div className="name">PlanIt</div>
          <button className="sign_out">Sign Out</button>
          <img className="pfp" src={user.photo} alt="Profile" />
        </div>

        <div className="main_content">
          <div className="navigation_menu">
            <div className="nav">My Trips</div>
            <div className="nav">Shared With Me</div>
            <div className="nav">Explore</div>
          </div>

          <div className="my_trips">
            <div className="my_trips_banner">
              <div className="trips_title">My Trips</div>
              <span>{user.first_name} {user.last_name}</span>
              <button className="new_trip_button">New Trip</button>
              <button className="sort_button">Sort</button>
            </div>

            <div className="trip_cards">
              {trips.length === 0 ? (
                <div>{user.first_name}, you haven't created any trips! PlanIt now!</div>
              ) : (
                trips.map((trip) => (
                  <div key={trip.id} className="trip_card">
                    <div className="trip_card_title">{trip.name}</div>
                    <div className = "trip_card_days">{trip.days} </div>
                  </div>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}