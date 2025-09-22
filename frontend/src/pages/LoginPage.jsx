import React from "react";
import "../css/LoginPage.css";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";

export default function LoginPage() {
  const handleLogin = () => {
    // redirect to the backend route that starts the Google OAuth2 flow
    window.location.href = (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/google";
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
