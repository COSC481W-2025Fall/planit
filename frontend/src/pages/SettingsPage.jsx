import React from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";

export default function SettingsPage() {
    return (
        <div className="trip_page">
            <TopBanner
                user={{ first_name: "Test", last_name: "User" }} // temporary placeholder
                onSignOut={() => {
                    window.location.href = "/";
                }}
            />

            <div className="main_content">
                <NavBar />

                <div className="my_trips">
                    <div className="my_trips_banner">
                        <div className="trips_title">Settings</div>
                    </div>

                    <div className="trip_cards">
                        <p>This is the settings page. Content will go here later.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
