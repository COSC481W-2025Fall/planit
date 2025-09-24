import React from "react";
import "../css/LoginPage.css";
import logo from "../assets/Planit_Full_Green.png";
import gLogo from "../assets/google-g-logo.webp";

export default function LoginPage() {
  const handleLogin = () => {
    // redirect to the backend route that starts the Google OAuth2 flow
       window.location.href = "http://localhost:3000/auth/google";

  };

  return (
    <div className = "parent-container">
      {/* Header section with app logo and welcome message */}
      <div className="header-container">
          <img src={logo} alt="PlanIt Logo" className="logo"/>    
          <h1>Welcome to PlanIt</h1>
           <p>Sign in to start planning your trips</p>
      </div>
      
      {/* Login box with sign in title and Google login button */}
        <div className = "login-container">
          <h1>Sign in</h1>
          <button className="login-button" onClick={handleLogin}>
            <img src={gLogo} alt="Google G" className="google-g"/>
            <span>Login with Google</span>
          </button>
        </div>
  </div>
  );
}
