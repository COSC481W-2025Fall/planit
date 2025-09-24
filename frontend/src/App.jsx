import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Routes>
            {/* Landing page as the root */}
            <Route path="/" element={<LandingPage />} />

            {/* Login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Trip page */}
            <Route
                path="/trip"
                element={
                    <ProtectedRoute>
                        <TripPage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;
