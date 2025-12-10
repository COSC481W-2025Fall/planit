import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import "../css/LandingPage.css";
import logo from "../assets/Planit_Full_Green.png";
import LandingHeroTripCard from "../components/LandingHeroTripCard.jsx";
import {Users, MapPin, Calendar, PiggyBank, Star, Sun, Moon} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useTheme } from "../theme/ThemeProvider.jsx";

export default function LandingPage() {
    const [selectedCard, setSelectedCard] = useState(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { theme, toggle } = useTheme();

    const handleRedirect = (path) => {
        navigate(path);
        setLoading(true);
    };

    return (
      <div className="landing">
          {loading && <LoadingSpinner/>}

          <header className="top-bar">
              <div className="brand">
                  <img src={logo} alt="PlanIt Logo" className="logo-img"/>
              </div>
              <nav className="nav-links">
                  <button
                    type="button"
                    className="theme-toggle"
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    onClick={toggle}
                  >
                      {theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}
                  </button>
                  <a href="/login" className="login-link" onClick={(e) => {
                      e.preventDefault();
                      handleRedirect("/login");
                  }}>
                      Log In
                  </a>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRedirect("/login")}
                  >
                      Get Started
                  </button>
              </nav>
          </header>
          <section className="hero">
              <div className="hero-wrapper">
                  <div className="hero-text">
                      <div className="hero-badge">
                          <MapPin size={16} />
                          Plan together, Travel together, Explore together
                      </div>

                      <h1 className="hero-title">
                          Where will your next <span className="accent">adventure</span> take you?
                      </h1>

                      <p className="hero-sub">
                          Plan trips with friends in real-time. Share ideas, discover hidden gems,
                          and create itineraries that turn dreams into unforgettable journeys.
                      </p>

                      <div className="hero-cta-row">
                          <button className="btn btn-primary" onClick={() => handleRedirect("/login")}>
                              <MapPin size={16} />
                              Start Planning
                          </button>
                      </div>

                      <div className="hero-avatars">
                          <div className="avatar">HW</div>
                          <div className="avatar">OM</div>
                          <div className="avatar">JD</div>
                          <div className="avatar">SK</div>
                          <span className="hero-count"><strong>100+</strong> travelers planning together</span>
                      </div>
                  </div>

                  <div className="hero-floating-cards">
                      <div className="card-1">
                          <LandingHeroTripCard
                              title="Mission to Tokyo"
                              location="Tokyo"
                              date="1/1/2026"
                              likes={8}
                              selected={selectedCard === 1}
                              onClick={() => setSelectedCard(1)}
                              image= "https://res.cloudinary.com/diw1ntqhi/image/upload/v1760919751/city_skyline_nhmuys.png"
                          />
                      </div>

                      <div className="card-2">
                          <LandingHeroTripCard
                              title="Girls Trip 2026"
                              location="Santorini"
                              date="8/15/2026"
                              likes={12}
                              selected={selectedCard === 2}
                              onClick={() => setSelectedCard(2)}
                              image="https://res.cloudinary.com/diw1ntqhi/image/upload/v1760919750/beach_jrlll5.png"
                          />
                      </div>

                      <div className="card-3">
                          <LandingHeroTripCard
                              title="Adventure Trek"
                              location="Peru"
                              date="10/10/2025"
                              likes={24}
                              selected={selectedCard === 3}
                              onClick={() => setSelectedCard(3)}
                              image="https://res.cloudinary.com/diw1ntqhi/image/upload/v1760919468/rainforest_uasxj9.png"
                          />
                      </div>
                  </div>
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
                      <Users className="feature-icon" size={32}/>
                      <h3 className="feature-title">Plan With Friends</h3>
                      <p className="feature-text">
                          Invite friends to collaborate on your trip itinerary in real-time
                      </p>
                  </div>
                  <div className="feature-card">
                      <MapPin className="feature-icon" size={32}/>
                      <h3 className="feature-title">Discover Places</h3>
                      <p className="feature-text">
                          Find amazing destinations and activities recommended by fellow travelers
                      </p>
                  </div>
                  <div className="feature-card">
                      <Calendar className="feature-icon" size={32}/>
                      <h3 className="feature-title">Smart Scheduling</h3>
                      <p className="feature-text">
                          Organize your days with intelligent scheduling that considers travel time
                      </p>
                  </div>
                  <div className="feature-card">
                      <PiggyBank className="feature-icon" size={32}/>
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
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="star" size={16} fill="currentColor"/>
                          ))}
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
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="star" size={16} fill="currentColor"/>
                          ))}
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
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="star" size={16} fill="currentColor"/>
                          ))}
                      </div>
                      <p className="quote">
                          “Perfect for both quick weekend getaways and long vacations. The interface
                          is intuitive and my friends love it too.”
                      </p>
                      <div className="person">
                          <div className="avatar">OM</div>
                          <div>
                              <div className="name">Oliver McMillen</div>
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
