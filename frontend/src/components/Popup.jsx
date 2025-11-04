import React from "react";
import "../css/Popup.css";

export default function Popup({ title, children, buttons, onClose, id }) {
  return (
    <div className="popup-screen-overlay" onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()} id={id}>
        {title && <div className="popup-title">{title}</div>}
        <div className="popup-form">{children}</div>
        {buttons && <div className="popup-buttons">{buttons}</div>}
      </div>
    </div>
  );
}