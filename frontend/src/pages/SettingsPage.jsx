import React, { useEffect, useState, useRef } from "react";
import "../css/SettingsPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { Camera } from "lucide-react";
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";
import GuestEmptyState from "../components/GuestEmptyState.jsx";
import Croppie from "croppie";
import "croppie/croppie.css";
import Popup from "../components/Popup.jsx";

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [stats, setStats] = useState(null);
    const [groupStats, setGroupStats] = useState(null);
    const [tab, setTab] = useState("userStats"); //"user stats" || "group stats"

    const [pfp, setPfp] = useState(null);

    //constants for the image cropper
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const croppieElement = useRef(null);
    const croppieInstance = useRef(null);

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
                setPfp(data.photo);
            })
            .catch((err) => console.error("User fetch error:", err));
    }, []);

    useEffect(() => {
        if (user && !isGuestUser(user?.user_id)) {
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

    //Initialize cropper 
    useEffect(() => {
        if (showCropper && tempImage && croppieElement.current) {
            
            // destroy any existing croppie instance
            if (croppieInstance.current) {
                croppieInstance.current.destroy();
                croppieInstance.current = null;
            }
            
            // clear the container's html
            croppieElement.current.innerHTML = ''; 

            //initialize croppie instance
            const c = new Croppie(croppieElement.current, {
                viewport: { width: 100, height: 100, type: 'circle' },
                boundary: { width: 300, height: 300 },
                showZoomer: true,
                enableOrientation: true
            });
            
            //bind the image to the croppie instance
            c.bind({
                url: tempImage,
            });

            //store the instance in ref 
            croppieInstance.current = c;
        }

        // Cleanup function
        return () => {
            if (croppieInstance.current) {
                croppieInstance.current.destroy();
                croppieInstance.current = null;
            }
        };
    }, [showCropper, tempImage]);

    //load group stats when group tab is clicked
    useEffect(() => {
        // once we set group stats this won't be called again "!groupStats
        if (tab === "groupStats" && user && !isGuestUser(user.user_id) && !groupStats) {
            const loadGroupStats = async () => {
                const data = await fetchGroupStats(user.user_id);
                setGroupStats(data);
            };
            loadGroupStats();
        }
    }, [tab, user, groupStats]);


    // fetch user stats endpoints
    const fetchUserStats = async (userID) => {
        try {
            const backend = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

            const res = await fetch(`${backend}/settings/getAllSettings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userID }),
            });

            return await res.json(); 
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            //set the temp image and open the popup to crop
            reader.onload = (e) => {
                setTempImage(e.target.result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file); //base64
        }
    };

    // Handle cropping and saving the profile picture
    const handleCropAndSave = async () => {
        if (!croppieInstance.current) return;

        //get the cropped image as a base64 string
        const base64Image = await croppieInstance.current.result({
            type: 'base64',
            size: { width: 100, height: 100 },
            format: 'jpeg',
            circle: false
        });

        setPfp(base64Image);
        setShowCropper(false);

        //send to backend
        try{
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
                        customPhoto: base64Image
                    }),
                }
            );

            const data = await response.json();
            if (response.ok && data.success) {
                setUser(data.user);
                toast.success("Profile picture updated successfully!")
            }
            else {
                toast.error("Photo invalid. Please try again.");
            }
        }
        catch(err){
            console.error("Update error:", err);
            toast.error("Could not update user info. Please try again.");
        }
    };

    const handleCancelCrop = () => {
        setShowCropper(false);
        setTempImage(null);
    }

    //fetch group stats endpoints
    const fetchGroupStats = async (userID) => {
        try {
            const backend = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

            const res = await fetch(`${backend}/settingsParticipant/getAllParticipantSettings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userID }),
            });

            return await res.json();
        } catch (err) {
            console.error("Error fetching group stats:", err);
        }
    };

    //handle saving new user info
    const handleSave = async () => {
        const trimmedFirst = firstName;
        const trimmedLast = lastName;
        const trimmedUser = username;

        const originalFirst = (user.first_name);
        const originalLast = (user.last_name);
        const originalUser = (user.username);

        const noChangesToUserData =
            trimmedFirst === originalFirst &&
            trimmedLast === originalLast &&
            trimmedUser === originalUser;

        if (noChangesToUserData) {
            return;
        }

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
                        customPhoto: user.photo,
                    }),
                }
            );

            const data = await response.json();
            let message = data.error;
            if (response.ok && data.success) {
                setUser(data.user);
                toast.success("User information updated successfully!")
            }
            else if (message === "Internal Server Error") {
                toast.error("Username already taken, try again");
            }
            else {
                toast.error(message);
            }
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Could not update user info. Please try again.");
        }
    };

    const isGuestUser = (userId) => {
        return userId && userId.toString().startsWith('guest_');
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

    // guest empty state if user is a guest
    if (isGuestUser(user.user_id)) {
        return (
            <div className="trip-page">
                <TopBanner user={user} isGuest={isGuestUser(user?.user_id)} />
                <div className="content-with-sidebar">
                    <NavBar />
                    <div className="main-content">
                        <GuestEmptyState title="Hi, Guest" description="You're currently browsing as a Guest. Sign in to view your profile settings!" />
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
                <NavBar userId={user.user_id} isGuest={isGuestUser(user?.user_id)}/>
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
                            <div className="info-card-container">
                                <div className="profile-picture">
                                    <img className="pfp pfp-preview" src={pfp || user.photo} alt="Profile" />
                                    <label htmlFor="imgupload" className="image-upload-button" title="Upload New Image"><Camera size={18} className="camera-icon"></Camera></label>
                                    <input
                                        id="imgupload"
                                        type="file"
                                        accept=".png, .jpg, .jpeg"
                                        onChange={handleFileChange}
                                    ></input>
                                </div>
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
                        </div>
 

                        {/* Viewing stats section */}
                        <div className="stats-card">

                            {/* Tab Buttons for User and Group Stats */}
                            <div className="stats-tabs">
                                <button
                                    className={`stats-tab ${tab === "userStats" ? "active" : ""}`}
                                    onClick={() => setTab("userStats")}
                                >User Stats
                                </button>  

                                 <button
                                    className={`stats-tab ${tab === "groupStats" ? "active" : ""}`}
                                    onClick={() => setTab("groupStats")}
                                >Group Stats
                                </button> 
                            </div>

                            {/* Display user stats */}
                            {tab === "userStats" && (
                            <div className="stats">
                                
                                <div className="stat-line">
                                    <span className="stat-label">Trips Made: </span>
                                    <span className="stat-value">{stats?.tripCount ?? "N/A"}</span>
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
                                    <span className="stat-value">{stats?.totalMoneySpent ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Total Likes: </span>
                                    <span className="stat-value">{stats?.totalLikes ?? "N/A"}</span>
                                </div>
                            </div>
                            )}

                            {/*Display group stats */}
                            {tab === "groupStats" && (
                            <div className="stats">
                                
                                <div className="stat-line">
                                    <span className="stat-label">Trips Shared With You: </span>
                                    <span className="stat-value">{groupStats?.tripCount ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Longest Trip: </span>
                                    <span className="stat-value">{groupStats?.longestTrip?.trip_name ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Most Expensive Trip: </span>
                                    <span className="stat-value">{groupStats?.mostExpensiveTrip?.trip_name ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Cheapest Trip: </span>
                                    <span className="stat-value">{groupStats?.cheapestTrip?.trip_name ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Total Money Spent: </span>
                                    <span className="stat-value">{groupStats?.totalMoneySpent ?? "N/A"}</span>
                                </div>

                                <div className="stat-line">
                                    <span className="stat-label">Total Likes: </span>
                                    <span className="stat-value">{groupStats?.totalLikes ?? "N/A"}</span>
                                </div>
                            </div>
                            )}                            
                        </div>
                    </div>
                    {/* Popup for cropping profile picture */}
                    {showCropper && (
                        <Popup
                            title="Adjust Profile Picture"
                            onClose={handleCancelCrop}
                            id="cropper-popup"
                            buttons={
                                <>
                                    <button type="button" onClick={handleCancelCrop}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-rightside"
                                        onClick={handleCropAndSave}
                                    >
                                        Save
                                    </button>
                                </>
                            }
                        >
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div 
                                    ref={croppieElement} 
                                    className="crop-wrapper" 
                                    style={{ width: "100%", height: "350px" }} 
                                ></div>
                            </div>
                        </Popup>
                    )}
                </div>
            </div>
        </div>
    );
}
