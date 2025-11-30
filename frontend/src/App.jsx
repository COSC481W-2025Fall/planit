import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import LandingPage from "./pages/LandingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import SettingsPage from "./pages/SettingsPage";
import TripDaysPage from "./pages/TripDaysPage"
import Registration from "./pages/NewUserSignUpPage";
import ExplorePage from "./pages/ExplorePage"; 
import SharedTripPage from "./pages/SharedTripPage";
import NotFound from './pages/NotFound';


function App() {
    return (
        <Routes>

            <Route
                path="/"
                element={
                    <PublicRoute>
                        <LandingPage />
                    </PublicRoute>
                }
            />

            <Route path="/login" element={<LoginPage />} />

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
                <Route
                path="/days/:tripId"
                element={
                    <ProtectedRoute>
                        <TripDaysPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/sharedTrips"
                element={
                    <ProtectedRoute>
                        <SharedTripPage />
                    </ProtectedRoute>
                }
            />
            <Route 
            path="/registration" 
            element={
            <Registration />
            } 
            />
            <Route
                path="/explore"
                element={
                    <ProtectedRoute>
                        <ExplorePage />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<NotFound />} />

    </Routes>
    );
}

export default App;