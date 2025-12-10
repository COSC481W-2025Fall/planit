import React, { useState, useRef, useEffect } from "react";
import "../css/Popup.css";
import { X } from "lucide-react";

export default function Popup({ title, children, buttons, onClose, id }) {
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const CLOSE_THRESHOLD = window.innerHeight * 0.25;
    const dragHandleRef = useRef(null);

    // Lock body scroll when popup mounts, unlock when it unmounts
    useEffect(() => {
        // Save current scroll position
        const scrollY = window.scrollY;

        // Lock scroll
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';

        // Cleanup: restore scroll when popup closes
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';

            // Restore scroll position
            window.scrollTo(0, scrollY);
        };
    }, []);

    const handleOverlayClick = (e) => {
        const activeTag = document.activeElement?.tagName;
        //If user is typing does not close typing
        if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

        if (e.target === e.currentTarget) {
            setTimeout(() => {
                document.activeElement?.blur();
                onClose();
            }, 60);

        }
    };

    // TOUCH EVENTS (Mobile)
    const handleTouchStart = (e) => {
        // Only allow drag if touch started on the drag handle area
        if (!dragHandleRef.current?.contains(e.target)) return;

        setIsDragging(true);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const delta = e.touches[0].clientY - startY;

        if (delta > 0) {
            setTranslateY(delta);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;

        if (translateY > CLOSE_THRESHOLD) {
            document.activeElement?.blur();
            onClose();
        }


        // Snap back
        setTranslateY(0);
        setIsDragging(false);
    };

    // MOUSE EVENTS (Desktop)
    const handleMouseDown = (e) => {
        if (window.innerWidth > 768) return; // Block on desktop
        if (!dragHandleRef.current?.contains(e.target)) return;

        setIsDragging(true);
        setStartY(e.clientY);
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const delta = e.clientY - startY;

        if (delta > 0) {
            setTranslateY(delta);
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;

        if (translateY > CLOSE_THRESHOLD) {
            onClose();
        }

        setTranslateY(0);
        setIsDragging(false);
    };

    // Add mouse move/up listeners when dragging starts
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, startY, translateY]);

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

                // Mouse listeners for desktop drag
                onMouseDown={handleMouseDown}

                // Apply transform when dragging
                style={{
                    transform: translateY ? `translateY(${translateY}px)` : "translateY(0)",
                    transition: isDragging ? "none" : "transform 0.25s ease"
                }}
            >
                {window.innerWidth <= 768 && (
                    <div
                        ref={dragHandleRef}
                        className="popup-drag-handle"
                    />
                )}

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