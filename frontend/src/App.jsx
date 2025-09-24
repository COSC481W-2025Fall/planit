import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Registration from "./pages/UserRegistrationPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route path="/registration" element={<Registration />} />

            <Route
                path="/trip"
                element={
                    <ProtectedRoute>
                        <TripPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />
    </Routes>
  );
}

export default App;
