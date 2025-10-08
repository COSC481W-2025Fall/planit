import React from "react";
import "../css/LoadingSpinner.css";

export default function LoadingSpinner({ visible = true }) {
    return (
        <div className={`loading-container ${visible ? "fade-in" : "fade-out"}`}>
            <div className="loading-spinner"></div>
        </div>
    );
}
