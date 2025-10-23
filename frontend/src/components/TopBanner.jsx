import React, { useState } from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";
import { Menu, X } from "lucide-react";
import NavBar from "./NavBar";
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <>
            <header className="top-banner">
                <div className="left-section">
                    {/* Hamburger toggle for mobile */}
                    <button
                        className="hamburger"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle navigation"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <img src={logo} alt="PlanIt Logo" className="logo" />
                </div>

            <div className="right-section">
                <button className="sign-out" onClick={handleSignOut}>
                    Sign Out
                </button>

                    {user?.photo ? (
                        <img className="pfp" src={user.photo} alt="Profile" />
                    ) : (
                        <div className="pfp placeholder">H</div>
                    )}
                </div>
            </header>

            {/* Sidebar (NavBar) */}
            <NavBar isOpen={isMenuOpen} />
        </>
    );
}

