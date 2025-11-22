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
  const [tempImage, setTempImage] = useState(null);

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

  const handleConfirm = () => {
    if (tempImage) {
      setSelectedImage(tempImage);
      if (onSelect) onSelect(tempImage);
    }
    setShowImageSelector(false);
  };

  // Clicking X (discard temp selection)
  const handleCancel = () => {
    setTempImage(selectedImage); // revert
    setShowImageSelector(false);
  };

  return (
    <>
      <div className="image-row">
        <button
            type="button"
            className="new-trip-button"
            onClick={() => setShowImageSelector(true)}
        >
          View Images
        </button>

        {selectedImage && (
            <img
                src={selectedImage.imageUrl}
                alt={selectedImage.image_name}
                className="selected-image-mini"
            />
        )}
      </div>



      {showImageSelector && (
        <Popup
          title="Select an Image"
          onClose={handleCancel}
          buttons={
            <>
              <button type="button" onClick={handleConfirm}>
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
                className={`image-selector-thumb ${tempImage?.image_id === img.image_id ? "selected" : ""
                  }`}
                onClick={() => setTempImage(img)}
              />
            ))}
          </div>
        </Popup>
      )}
    </>
  );
}   