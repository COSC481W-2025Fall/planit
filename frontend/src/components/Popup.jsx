import React from "react";
import "../css/Popup.css";
import { X } from "lucide-react";

export default function Popup({ title, children, buttons, onClose, id }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setTimeout(() => {
        onClose();
      }, 120); // small delay
    }
  };
  return (
    <div className="popup-screen-overlay" onClick={handleOverlayClick}>
      <div className="popup" onClick={(e) => e.stopPropagation()} id={id}>
        <button className="popup-close-btn" onClick={onClose}>
          <X size={15} strokeWidth={2.5} />
        </button>
        {title && <div className="popup-title">{title}</div>}
        <div className="popup-form">{children}</div>
        {buttons && <div className="popup-buttons">{buttons}</div>}
      </div>
    </div>
  );
}