import React from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import {toast} from "react-toastify";

const handleSignOut = () => {
    fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/logout",
        { credentials: "include" }
    )
        .then((res) => {
            if (res.ok) {
                // Successful logout, redirect the user
                window.location.href = "/login";
            } else {
                toast.error("Failed to log out.");
            }
        })
        .catch((err) => toast.error("Logout error:", err));
};


export default function TopBanner({ user }) {
    return (
        <div className="top-banner">
            <img src={logo} alt="PlanIt Logo" className="logo" />

            <div className="right-section">
                <button className="sign-out" onClick={handleSignOut}>
                    Sign Out
                </button>

                {user?.photo ? (
                    <img className="pfp" src={user.photo} alt="Profile" />
                ) : (
                    <div className="pfp placeholder">?</div>
                )}
            </div>
        </div>
    );
}
