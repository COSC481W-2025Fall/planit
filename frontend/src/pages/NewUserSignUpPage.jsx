import React, { useState, useEffect } from "react";
import "../css/NewUserSignUpPage.css";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import logo from "../assets/Planit_Full_Green.png";

export default function UserRegistrationPage() {
  const [user, setUser] = useState(null); // store logged-in user
  const [createUsername, setCreateUsername] = useState("");

  // run this code when the component first loads
  useEffect(() => {
    fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        "/auth/login/details",
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn === false) return;
        setUser(data);
      });
  }, []);

  // Function to send requests to the backend
  const sendRequest = async (endpoint, method, body = null) => {
    const options = { method, credentials: "include", headers: {} };

    if (body && method !== "GET") {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        `/user/${endpoint}`,
      options
    );
    const data = await response.json();

    if (!response.ok) console.error(data.error);
    if (data.user) {
        setUser(data.user);
    }

    return data;
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="parent-container">
      {/* Header section with app logo and welcome message */}
      <div className="header-container">
        <img src={logo} alt="PlanIt Logo" className="login-logo" />
        <h1>Welcome to PlanIt</h1>
        <p>Enter a username to start planning your trips</p>
      </div>

      {/* White box wrapping input + button */}
      <div className="username-box">

        <input
          type="text"
          placeholder="Enter username"
          value={createUsername}
          onChange={(e) => setCreateUsername(e.target.value)}
        />

        <button
          className="save-button"
          onClick={async () =>
            await sendRequest("create", "POST", {
              userId: user.user_id,
              createUsername,
            })
          }
        >
          Save
        </button>
      </div>
    </div>
  );
}
