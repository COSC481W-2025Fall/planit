import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import User from "./pages/UserPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/trip"
        element={
          <ProtectedRoute>
            <TripPage />
          </ProtectedRoute>
        }
      />
      <Route path="/user" element={<User />} />
    </Routes>
  );
}

export default App;
