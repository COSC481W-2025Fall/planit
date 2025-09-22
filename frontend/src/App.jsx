import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Test from "./pages/Test";
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path = "/testing" element = {<Test />} />
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
