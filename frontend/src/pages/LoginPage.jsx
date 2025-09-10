import React from "react";
import "../css/LoginPage.css";

export default function LoginPage() {
  const handleLogin = () => {
    // redirect to the backend route that starts the Google OAuth2 flow
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div class = "parent-container">
        <div class = "login-container">
            <h2 class = "title">PlanIt</h2>
            <button class = "login-with-google-button" onClick={handleLogin}>
             Log in with Google
            </button>
        </div>
    </div>
  );
}
