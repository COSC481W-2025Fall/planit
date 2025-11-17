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
    const [pfp, setPfp] = useState(null);

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
                    setStats(statsData);
                } catch (err) {
                    console.error("Error loading stats:", err);
                }
            };
            loadStats();
        }
    }, [user]);


    // fetch stats endpoints
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

    //handle saving new user info
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
                        customPhoto: pfp
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

    const resizeImage = (pfp) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 100;
                    canvas.height = 100;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 100, 100);
                    resolve(canvas.toDataURL('image/jpeg'));
                };
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(pfp);
        });
    };

    const handleUpload = async (event) => {
        event.preventDefault();

        if (!file) {
            alert("Select a file first");
            return;
        }

        // Resize to base64
        const base64Image = await resizeImage(file);

        // Send to backend
        const response = await fetch(
            (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/profile/store",
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ userId: user.user_id, customPhoto: base64Image })
            }
        );
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
                            <div className="settings-title" data-testid="settings-title">Settings</div>
                        </div>
                    </div>

                    <div className="settings-section">
                        {/* Section to update info */}
                        <div className="info-card">
                            <h3>Update Information</h3>
                            <div className="settings-form">
                                <div>
                                    {user && user.photo && (
                                        <img src={user.photo} alt="Profile" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setPfp(e.target.files[0])}
                                    />
                                    <button onClick={handleUpload}>Save</button>
                                </div>
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
                                
                                <div className="stat-line">
                                    <span className="stat-label">Number of Trips Made: </span>
                                    <span className="stat-value">{stats?.tripCount?.tripCount ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Longest Trip: </span>
                                    <span className="stat-value">{stats?.longestTrip?.trip_name ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Most Expensive Trip: </span>
                                    <span className="stat-value">{stats?.mostExpensiveTrip?.trip_name ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Cheapest Trip: </span>
                                    <span className="stat-value">{stats?.cheapestTrip?.trip_name ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Total Money Spent: </span>
                                    <span className="stat-value">{stats?.totalMoneySpent?.totalMoneySpent ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Total Likes: </span>
                                    <span className="stat-value">{stats?.totalLikes?.totalLikes ?? "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
