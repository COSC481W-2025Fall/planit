import React, { useState } from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";
import { Menu, X,Sun, Moon} from "lucide-react";
import NavBar from "./NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { toast } from "react-toastify";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { Link } from "react-router-dom";

const handleSignOut = () => {
  fetch(
    (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/logout",
    { credentials: "include" }
  )
    .then((res) => {
      if (res.ok) {
        window.location.href = "/login";
      } else {
        toast.error("Failed to log out.");
      }
    })
    .catch((err) => toast.error(`Logout error: ${err?.message || err}`));
};

export default function TopBanner({ user , isGuest}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggle } = useTheme(); // << use inside the component

  return (
    <>
      <header className="top-banner">
        <div className="left-section">
          <button
            className="hamburger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/trip">
          <img src={logo} alt="PlanIt Logo" className="logo" />
          </Link>
        </div>

        <div className="right-section">
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="theme-toggle"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!isGuest ? (
          <button className="sign-out" onClick={handleSignOut}>
            Sign Out
          </button>
          ) : (
          <Link className="sign-out" to ="/login">Log-in</Link>
          )}

          {!isGuest && (
            user?.photo ? (
              <Link className="pfp-link" to="/settings">
                <img className="pfp top-banner-pfp" src={user.photo} alt="Profile"/>
              </Link>
            ) : (
              <Link className="pfp-link" to="/settings">
                <div className="pfp placeholder top-banner-pfp">H</div>
              </Link>
            )
          )}
        </div>
      </header>

      <NavBar isOpen={isMenuOpen} />
    </>
  );
}
