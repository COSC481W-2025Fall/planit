import React, { useState } from "react";
import "../css/Popup.css";
import { X } from "lucide-react";

export default function Popup({ title, children, buttons, onClose, id, }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const CLOSE_THRESHOLD = window.innerHeight * 0.25;

  const handleOverlayClick = (e) => {
    const activeTag = document.activeElement?.tagName;
    //If user is typing does not close typing
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

    if (e.target === e.currentTarget) {
      setTimeout(() => onClose(), 120);
    }
  };

  // Touch drag start
  const handleTouchStart = (e) => {
    // Only allow drag from top 40px of popup
    const popupTop = e.target.closest(".popup")?.getBoundingClientRect()?.top;
    const touchY = e.touches[0].clientY;

    if (touchY - popupTop > 50) return; // Not in top area -> do not drag

    setIsDragging(true);
    setStartY(touchY);
  };

  // Touch drag move
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - startY;

    if (delta > 0) {
      setTranslateY(delta);
    }
  };

  // Touch drag end
  const handleTouchEnd = () => {
    if (!isDragging) return;

    if (translateY > CLOSE_THRESHOLD) {
      onClose(); // Drag down to close
    }

    // Snap back
    setTranslateY(0);
    setIsDragging(false);
  };

  return (
    <div className="popup-screen-overlay" onClick={handleOverlayClick}>
      <div
          className="popup"
          id={id}
          onClick={(e) => e.stopPropagation()}

          // Touch listeners for mobile drag
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}

          // Apply transform when dragging
          style={{
            transform: translateY ? `translateY(${translateY}px)` : "translateY(0)",
            transition: isDragging ? "none" : "transform 0.25s ease"
          }}
      >
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