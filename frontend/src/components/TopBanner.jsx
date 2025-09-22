import React from "react";

export default function TopBanner({ user, onSignOut }) {
    return (
        <div className="top_banner">
            {/* Brand / title */}
            <div className="name">PlanIt</div>

            {/* Sign out button */}
            <button className="sign_out" onClick={onSignOut}>
                Sign Out
            </button>

            {/* User profile photo */}
            {user?.photo ? (
                <img className="pfp" src={user.photo} alt="Profile" />
            ) : (
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