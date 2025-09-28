import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import SettingsPage from "./pages/SettingsPage";

function App() {
    return (
        <Routes>
<<<<<<< HEAD
            <Route path="/" element={<LoginPage />} />
=======

            <Route
                path="/"
                element={
                    <PublicRoute>
                        <LandingPage />
                    </PublicRoute>
                }
            />

>>>>>>> origin/planit-v1
            <Route path="/login" element={<LoginPage />} />
            <Route path="/testing" element={<Test />} />

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
<<<<<<< HEAD
        </Routes>
    );
=======
    </Routes>
  );
>>>>>>> origin/planit-v1
}

export default App;
