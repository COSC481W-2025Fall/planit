import React from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import "../css/GuestEmptyState.css";

export default function GuestEmptyState() {
    const navigate = useNavigate();

    return (
        <div className="guest-empty-state">
            <div className="guest-empty-card">
                <User className="guest-icon" size={30} />
                <h2>Welcome, Guest!</h2>
                <p className="guest-message">
                    You're currently browsing as a guest. Sign in to create and save your own trips.
                </p>

                <div className="guest-features">
                    <h3>With an account, you can:</h3>
                    <ul>
                        <li>Create unlimited trips</li>
                        <li>Save your itineraries permanently</li>
                        <li>Share trips with friends and family</li>
                        <li>Like and save other travelers' trips</li>
                        <li>Access your trips from any device</li>
                    </ul>
                </div>

                <button
                    className="guest-signin-btn"
                    onClick={() => navigate("/login")}
                >
                    <LogIn size={18} />
                    Sign In to Get Started
                </button>

                <p className="guest-explore-text">
                    Or continue exploring public trips on the{" "}
                    <button
                        className="explore-link"
                        onClick={() => navigate("/explore")}
                    >
                        Explore page
                    </button>
                </p>
            </div>
        </div>
    );
}