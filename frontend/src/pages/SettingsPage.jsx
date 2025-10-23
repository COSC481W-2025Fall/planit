import React, {useEffect, useState} from "react";
import "../css/SettingsPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import {MoonLoader} from "react-spinners";

export default function SettingsPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
            "/auth/login/details",
            {credentials: "include"}
        )
            .then((res) => res.json())
            .then((data) => {
                if (data.loggedIn === false) return;
                setUser(data);
            })
            .catch((err) => console.error("User fetch error:", err));
    }, []);

    //Loading state
    if (!user) {
        return (
            <div className="setting-page">
                <TopBanner user={user} />
                <div className="content-with-sidebar">
                    <NavBar/>
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

    //Main content
    return (
        <div className="setting-page">
            <TopBanner user={user}/>
            <div className="content-with-sidebar">
                <NavBar/>
                <div className="main-content">
                    <div className="settings-section">
                        {/* Header row */}
                        <div className="settings-header">
                            <div className="settingss-title-section">
                                <div className="settings-title" data-testid="settings-title">Settings</div>
                                <div className="settings-subtitle">
                                    This is the settings page. Content will go here later
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

