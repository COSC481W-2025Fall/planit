import React, {useEffect, useState} from "react";
import "../css/SettingsPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import {MoonLoader} from "react-spinners";

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");


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
                setFirstName(data.first_name || "");
                setLastName(data.last_name || "");
                setUsername(data.username || "");
            })
            .catch((err) => console.error("User fetch error:", err));
    }, []);

    const handleSave = async () => {
        try {
            const response = await fetch(
                (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/user/update",
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        userId: user.user_id,
                        firstname: firstName,
                        lastname: lastName,
                        username: username,
                    }),
                }
            );

            const data = await response.json();
            if(response.ok && data.success){
                setUser(data.user);
            }
        } catch (err){
            console.error("Update error:", err);
        }

    }
    //Loading state
    if (!user) {
        return (
            <div className="setting-page">
                <TopBanner user={user}/>
                <div className="setting-with-sidebar">
                    <NavBar/>
                    <div className="setting-main-content">
                        <div className="setting-page-loading-container">
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
            <div className="setting-with-sidebar">
                <NavBar/>
                <div className="setting-main-content">
                        {/* Header row */}
                        <div className="settings-header">
                            <div className="settingss-title-section">
                                <div className="settings-title">Settings</div>
                            </div>
                        </div>
                        <div className="settings-section">
                            {/*Section to update info*/}
                            <div className="info-card">
                                <h3>Update Information</h3>
                                <div className="settings-form">
                                    <label>
                                        First Name: 
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}/>
                                    </label>

                                    <label>
                                        Last Name: 
                                       <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}/>
                                    </label>

                                    <label>
                                    Username: 
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}/>
                                     </label>

                                    <button className="save-button" onClick={handleSave}>Save Changes</button>
                                </div>
                             </div>

                             {/* Viewing stats section*/}
                             <div className="stats-card">
                                <h3>User Stats</h3>
                                <div className="stats">
                                    <p>Number of Trips Made:</p>
                                    <p>Longest Trip:</p>
                                    <p>Most Expensive Trip:</p>
                                    <p>Cheapest Trip:</p>
                                    <p>Total Money Spent:</p>
                                    <p>Total Likes: </p>
                                </div>
                             </div>
                     </div>
                 </div>
            </div>
        </div>
    );
}

