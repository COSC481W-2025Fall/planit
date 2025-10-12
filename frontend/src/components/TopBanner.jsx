import React, { useState } from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";
import { Menu, X } from "lucide-react";
import NavBar from "./NavBar";

export default function TopBanner({ user, onSignOut }) {
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
                    <button className="sign-out" onClick={onSignOut}>
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

