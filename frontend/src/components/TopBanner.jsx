import React, { useState } from "react";
import logo from "../assets/Planit_Full_Green.png";
import "../css/TopBanner.css";
import { Menu, X} from "lucide-react";
import NavBar from "./NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { toast } from "react-toastify";
import { useTheme } from "../theme/ThemeProvider.jsx";
import { Classic } from "@theme-toggles/react";
import "@theme-toggles/react/css/Classic.css";

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

export default function TopBanner({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme(); // << use inside the component

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

          <img src={logo} alt="PlanIt Logo" className="logo" />
        </div>

        <div className="right-section">
          <Classic
            className="theme-toggle"
            toggled={theme === "dark"}
            toggle={(t) => setTheme(t ? "dark" : "light")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            duration={750}
          />

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

      <NavBar isOpen={isMenuOpen} />
    </>
  );
}
