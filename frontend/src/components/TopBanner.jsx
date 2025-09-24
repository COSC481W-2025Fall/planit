import React from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";

export default function TopBanner({ user, onSignOut }) {
    return (
        <div className="top_banner">
            <img src={logo} alt="PlanIt Logo" className="logo" />

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
