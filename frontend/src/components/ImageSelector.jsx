import React, { useState, useEffect } from "react";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import Popup from "./Popup";
import "../css/Popup.css";
import "../css/TripPage.css";
export default function TripCardImages({trip, onSelect}) {
  //constants for image selection
  const [images, setImages] = useState([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch images when the selector is opened
  useEffect(() => {
    if (!showImageSelector) return;
    const fetchImages = async () => {
      try {
        const res = await fetch(
          (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
          "/image/readAll",
          { credentials: "include" }
        );
        const data = await res.json();
        setImages(data);
      } catch (err) {
        console.error("Error fetching images:", err);
      }
    };
    fetchImages();
  }, [showImageSelector]);

  // Needed to send selected image to parent.
  const handleSelectImage = (img) => {
    setSelectedImage(img);
    if (onSelect) onSelect(img);
  };
  
  return (
    <>
      <button
        type="button"
        className="new-trip-button"
        onClick={() => setShowImageSelector(true)}
        style={{ marginTop: "10px" }}
      >
        View Images
      </button>

      {/* Selected image preview */}
      {selectedImage && (
        <div className="selected-image-container">
          <img
            src={selectedImage.imageUrl}
            alt={selectedImage.image_name}
            className="selected-image-thumb"
          />
          <p>{selectedImage.image_name}</p>
        </div>
      )}

      {showImageSelector && (
        <Popup
          title="Select an Image"
          buttons={
            <>
              <button type="button" onClick={() => setShowImageSelector(false)}>
                Done
              </button>
            </>
          }
        >
          <div className="image-selector-grid">
            {images.map((img) => (
              <img
                key={img.image_id}
                src={img.imageUrl}
                alt={img.image_name}
                className={`image-selector-thumb ${selectedImage?.image_id === img.image_id ? "selected" : ""
                  }`}
                onClick={() => handleSelectImage(img)}
              />
            ))}
          </div>
        </Popup>
      )}
    </>
  );
}   