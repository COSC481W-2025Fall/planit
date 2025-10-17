import React from "react";
import { MoonLoader } from "react-spinners";
import "../css/LoadingSpinner.css";

export default function LoadingSpinner() {
    return (
        <div className="loading-overlay">
            <MoonLoader
                color="var(--accent)"
                size={70}
                speedMultiplier={0.9}
            />
        </div>
    );
}

