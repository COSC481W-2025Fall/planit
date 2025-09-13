import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TripPage from "./pages/TripPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TestPage from "./pages/TestPage.jsx";

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
        {/*<Route*/}
        {/*    path="/testPage"*/}
        {/*    element={<TestPage />}*/}
        {/*/>*/}
    </Routes>
  );
}

export default App;
