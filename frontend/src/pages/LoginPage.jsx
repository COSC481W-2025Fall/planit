import React from "react";
import "../css/LoginPage.css";

export default function LoginPage() {
  const handleLogin = () => {
    // redirect to the backend route that starts the Google OAuth2 flow
    window.location.href = "https://api.planit-travel.me/auth/google";
  };

  return (
    <div className = "parent-container">
        <div className = "login-container">
            <h2 className = "title">PlanIt</h2>
            <button className = "login-with-google-button" onClick={handleLogin}>
             Log in with Google
            </button>
        </div>
    </div>
  );
}
