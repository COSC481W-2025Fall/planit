import React from "react";
import "../css/Popup.css";
import { createPortal } from "react-dom";

export default function Popup({ title, children, buttons }) {
    const modal = (
        <div className="popup-screen-overlay">
            <div className="popup">
                {title && <div className="popup-title">{title}</div>}
                <div className="popup-form">{children}</div>
                {buttons && <div className="popup-buttons">{buttons}</div>}
            </div>
        </div>
    );
    return createPortal(modal, document.body);
}