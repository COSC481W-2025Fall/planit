import React from "react";
import "./trip_page.css";

export default function TripPage() {
  return (
    <div className="trip_page">
        <div className="top_banner">
          <div className="name">PlanIt</div>
          <button className="sign_out">Sign Out</button>
          <button className="pfp">PFP</button>
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
              <button className="new_trip_button">New Trip</button>
              <button className="sort_button">Sort</button>
            </div>

            <div className="trip_cards">
              <div className="trip">Trip A</div>
              <div className="trip">Trip B</div>
            </div>
          </div>
      </div>
    </div>
  );
}