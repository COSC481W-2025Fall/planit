import React from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css"; // make sure path matches your project structure

export default function TopBanner({ user, onSignOut }) {
    return (
        <div className="top_banner">
            {/* Logo (replaces the text "PlanIt") */}
            <img src={logo} alt="PlanIt Logo" className="logo" />

            {/* Right side: Sign out + profile picture */}
            <div className="right_section">
                <button className="sign_out" onClick={onSignOut}>
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
