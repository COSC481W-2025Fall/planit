import React from "react";
import "../css/LoginPage.css";

export default function LoginPage() {
  const handleLogin = () => {
    // redirect to the backend route that starts the Google OAuth2 flow
    window.location.href = "http://localhost:3000/auth/google";
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
