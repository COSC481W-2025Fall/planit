import React from "react";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch( (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/user", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setLoggedIn(data.loggedIn);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!loggedIn) return <Navigate to="/" />;

  return children;
}