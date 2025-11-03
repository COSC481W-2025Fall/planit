import React, { useEffect, useState } from "react";
import "../css/SettingsPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
            "/auth/login/details",
            { credentials: "include" }
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

    useEffect(() => {
        if (user) {
            const loadStats = async () => {
                try {
                    const statsData = await fetchUserStats(user.user_id);
                    console.log("Fetched stats:", statsData);
                    setStats(statsData);
                } catch (err) {
                    console.error("Error loading stats:", err);
                }
            };
            loadStats();
        }
    }, [user]);


    // fetch all stats endpoints
    const fetchUserStats = async (userID) => {
        try {
            const backend = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

            const postData = async (endpoint) => {
                const res = await fetch(`${backend}/settings/${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userID }),
                });
                return res.json();
            };

            const [
                tripCount,
                longestTrip,
                mostExpensiveTrip,
                cheapestTrip,
                totalMoneySpent,
                totalLikes,
            ] = await Promise.all([
                postData("tripCount"),
                postData("longestTrip"),
                postData("mostExpensiveTrip"),
                postData("cheapestTrip"),
                postData("totalMoneySpent"),
                postData("totalLikes"),
            ]);

            return {
                tripCount,
                longestTrip,
                totalLikes,
                cheapestTrip,
                mostExpensiveTrip,
                totalMoneySpent
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const handleSave = async () => {
        try {
            const response = await fetch(
                (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
                "/user/update",
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
            if (response.ok && data.success) {
                setUser(data.user);
                toast.success("User information updated successfully!")
            }
            else {
                toast.error("Username already taken. Please try again.");
            }
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Could not update user info. Please try again.");
        }
    };

    // Loading state
    if (!user) {
        return (
            <div className="setting-page">
                <TopBanner user={user} />
                <div className="setting-with-sidebar">
                    <NavBar />
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

    // Main content
    return (
        <div className="setting-page">
            <TopBanner user={user} />
            <div className="setting-with-sidebar">
                <NavBar />
                <div className="setting-main-content">
                    {/* Header row */}
                    <div className="settings-header">
                        <div className="settingss-title-section">
                            <div className="settings-title">Settings</div>
                        </div>
                    </div>

                    <div className="settings-section">
                        {/* Section to update info */}
                        <div className="info-card">
                            <h3>Update Information</h3>
                            <div className="settings-form">
                                <label>
                                    First Name:
                                    <input
                                        type="text"
                                        value={firstName}
                                        maxLength={20}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </label>

                                <label>
                                    Last Name:
                                    <input
                                        type="text"
                                        value={lastName}
                                        maxLength={20}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </label>

                                <label>
                                    Username:
                                    <input
                                        type="text"
                                        value={username}
                                        maxLength={20}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </label>

                                <button className="save-button" onClick={handleSave}>
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Viewing stats section */}
                        <div className="stats-card">
                            <h3>User Stats</h3>
                            <div className="stats">
                                <p>Number of Trips Made:</p>
                                <h1>{stats?.tripCount?.tripCount ?? "N/A"}</h1>

                                <p>Longest Trip:</p>
                                <h1>{stats?.longestTrip?.trip_name ?? "N/A"}</h1>

                                <p>Most Expensive Trip:</p>
                                <h1>{stats?.mostExpensiveTrip?.trip_name ?? "N/A"}</h1>

                                <p>Cheapest Trip:</p>
                                <h1>{stats?.cheapestTrip?.trip_name ?? "N/A"}</h1>

                                <p>Total Money Spent:</p>
                                <h1>{stats?.totalMoneySpent?.totalMoneySpent ?? "N/A"}</h1>

                                <p>Total Likes:</p>
                                <h1>{stats?.totalLikes?.totalLikes ?? "N/A"}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
