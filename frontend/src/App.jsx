import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import Registration from "./pages/UserRegistrationPage";
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
      <Route path="/registration" element={<Registration />} />
    </Routes>
  );
}

export default App;
