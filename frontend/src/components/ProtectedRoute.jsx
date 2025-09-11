import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/auth/user", { credentials: "include" })
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
