import React from "react";
import { Routes, Route } from "react-router-dom"; // React Router components
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Routes>
            {/* Public route: Login page */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected route: Trips page */}
            <Route
                path="/trip"
                element={
                    <ProtectedRoute>
                        <TripPage /> {/* Only renders if user is logged in */}
                    </ProtectedRoute>
                }
            />

            {/* Protected route: Settings page */}
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <SettingsPage /> {/* Only renders if user is logged in */}
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;
