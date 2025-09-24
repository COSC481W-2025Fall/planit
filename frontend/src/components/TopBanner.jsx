import React from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";

export default function TopBanner({ user, onSignOut }) {
    return (
        <div className="top-banner">
            <img src={logo} alt="PlanIt Logo" className="logo" />

            <div className="right-section">
                <button className="sign-out" onClick={onSignOut}>
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
