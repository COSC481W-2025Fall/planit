import React, { useEffect, useState } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";

export default function SettingsPage() {
    const [user, setUser] = useState(null);

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

    if (!user) return <div>Loading...</div>;

    return (
        <div className="trip-page">
            <TopBanner
                user={user}
                onSignOut={() => (window.location.href = "/")}
            />

            <div className="main-content">
                <NavBar />
                <div className="my-trips">
                    <div className="my-trips-banner">
                        <div className="trips-title">Settings</div>
                    </div>
                    <div className="trip-cards">
                        <p>This is the settings page. Content will go here later.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
