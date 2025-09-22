import React from "react";
import logo from "../assets/Planit_Full_Green.png"; // Import your logo image (make sure the path is correct)

export default function TopBanner({ user, onSignOut }) {
    return (
        <div className="top_banner"> {/* Main top banner container */}

            {/* Logo (replaces the text "PlanIt") */}
            <img src={logo} alt="PlanIt Logo" className="logo" />

            {/* Sign out button on the right side */}
            <button className="sign_out" onClick={onSignOut}>
                Sign Out
            </button>

            {/* User profile photo (or fallback if no photo) */}
            {user?.photo ? (
                // Show actual profile photo if user has one
                <img className="pfp" src={user.photo} alt="Profile" />
            ) : (
                // Placeholder with "?" if no profile photo exists
                <div
                    className="pfp"
                    style={{
                        background: "var(--accent-lite)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "var(--muted)",
                    }}
                >
                    ?
                </div>
            )}
        </div>
    );
}
