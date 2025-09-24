import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/LandingPage.css";
import logo from "../assets/Planit_Full_Green.png";

export default function LandingPage() {
    const navigate = useNavigate();

    const handleStartPlanning = () => {
        navigate("/login");
    };

    return (
        <div className="landing">
            <header className="top-bar">
                <div className="brand">
                    <img src={logo} alt="PlanIt Logo" className="logo-img" />
                </div>

                <nav className="nav-links">
                    <a href="/login" className="login-link">Log In</a>
                    <button className="btn btn-primary" onClick={() => navigate("/login")}>
                        Get Started
                    </button>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-inner">
                    <h1 className="hero-title">
                        The most effective way to <br />
                        plan <span className="accent">trips</span>
                    </h1>

                    <p className="hero-sub">
                        Create incredible travel experiences with friends. Plan together,
                        explore together, and make memories that last a lifetime.
                    </p>

                    <button
                        className="btn btn-primary hero-cta"
                        onClick={handleStartPlanning}
                    >
                        Start Planning
                    </button>
                </div>
            </section>

            <section className="sub">
                <div className="sub-inner">
                    <h2 className="sub-title">
                        Plan Trips By Actually <span className="accent">Collaborating</span>
                    </h2>
                    <p className="sub-copy">
                        Make travel planning fun and social with tools designed for group adventures
                    </p>
                </div>
            </section>
        </div>
    );
}
