import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/LandingPage.css";
import logo from "../assets/Planit_Full_Green.png";
import { Users, MapPin, Calendar, PiggyBank, Star } from "lucide-react";

export default function LandingPage() {
    const navigate = useNavigate();
    const handleStartPlanning = () => navigate("/login");

    return (
        <div className="landing">
            <header className="top-bar">
                <div className="brand">
                    <img src={logo} alt="PlanIt Logo" className="logo-img" />
                </div>
                <nav className="nav-links">
                    <a href="/login" className="login-link">Log In</a>
                    <button
                        className="btn btn-primary"
                        onClick={handleStartPlanning}
                    >
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

            <section className="features">
                <div className="features-grid">
                    <div className="feature-card">
                        <Users className="feature-icon" size={32} />
                        <h3 className="feature-title">Plan With Friends</h3>
                        <p className="feature-text">
                            Invite friends to collaborate on your trip itinerary in real-time
                        </p>
                    </div>
                    <div className="feature-card">
                        <MapPin className="feature-icon" size={32} />
                        <h3 className="feature-title">Discover Places</h3>
                        <p className="feature-text">
                            Find amazing destinations and activities recommended by fellow travelers
                        </p>
                    </div>
                    <div className="feature-card">
                        <Calendar className="feature-icon" size={32} />
                        <h3 className="feature-title">Smart Scheduling</h3>
                        <p className="feature-text">
                            Organize your days with intelligent scheduling that considers travel time
                        </p>
                    </div>
                    <div className="feature-card">
                        <PiggyBank className="feature-icon" size={32} />
                        <h3 className="feature-title">Budget Friendly</h3>
                        <p className="feature-text">
                            Keep track of spending across your entire trip
                        </p>
                    </div>
                </div>
            </section>

            <section className="loved">
                <h2 className="loved-title">
                    Loved by <span className="accent">Travelers</span> Worldwide
                </h2>
                <p className="loved-sub">
                    Join thousands of happy travelers who use PlanIt to create unforgettable experiences
                </p>
            </section>

            <section className="testimonials">
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <div className="stars">
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                        </div>
                        <p className="quote">
                            “Plan It made organizing our group trip to Japan so much easier.
                            Everyone could contribute ideas and we never missed a detail!”
                        </p>
                        <div className="person">
                            <div className="avatar">HM</div>
                            <div>
                                <div className="name">Hunter Martin</div>
                                <div className="role">Travel Enthusiast</div>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="stars">
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                        </div>
                        <p className="quote">
                            “The collaborative features are amazing. We planned a 2-week European
                            adventure with 6 friends and it was seamless.”
                        </p>
                        <div className="person">
                            <div className="avatar">HM</div>
                            <div>
                                <div className="name">Hass Mouzaihem</div>
                                <div className="role">Adventure Seeker</div>
                            </div>
                        </div>
                    </div>

                    <div className="testimonial-card">
                        <div className="stars">
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                            <Star className="star" size={16} fill="currentColor" />
                        </div>
                        <p className="quote">
                            “Perfect for both quick weekend getaways and long vacations. The interface
                            is intuitive and my friends love it too.”
                        </p>
                        <div className="person">
                            <div className="avatar">OM</div>
                            <div>
                                <div className="name">Oliver McMillen </div>
                                <div className="role">Weekend Warrior</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <p>© 2025 PlanIt. All rights reserved.</p>
            </footer>
        </div>
    );
}
