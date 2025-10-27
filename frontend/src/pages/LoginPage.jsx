import React from "react";
import "../css/LoginPage.css";
import logo from "../assets/Planit_Full_Green.png";
import gLogo from "../assets/google-g-logo.webp";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";

export default function LoginPage() {
  const handleLogin = () => {
    const backendURL =
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
      "/auth/google";
    window.location.href = backendURL;
  };

  return (
    <div className="login-page">
      {/* Header section */}
      <div className="header-container">
        <img src={logo} alt="PlanIt Logo" className="login-logo"/>
        <h1>Welcome to PlanIt</h1>
        <p>Sign in to start planning your trips</p>
      </div>

      {/* Login box */}
      <div className="login-container">
        <h2>Sign In</h2>
        <button className="login-button" onClick={handleLogin}>
          <img src={gLogo} alt="Google G" className="google-g"/>
          <span>Login with Google</span>
        </button>
      </div>
    </div>
  );
}
