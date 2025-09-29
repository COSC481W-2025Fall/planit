import React from "react";
import "../css/Popup.css";

export default function Popup({ title, children, buttons }) {
  return (
    <div className="popup-screen-overlay">
      <div className="popup">
        {title && <p>{title}</p>}
        <div className="popup-form">
          {children}
        </div>
        {buttons && (
          <div className="popup-buttons">
            {buttons}
          </div>
        )}
      </div>
    </div>
  );
}