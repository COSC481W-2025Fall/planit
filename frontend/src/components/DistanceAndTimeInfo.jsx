import React from "react";
import { Car, Footprints } from "lucide-react";
import { MoonLoader } from "react-spinners";

export default function DistanceAndTimeInfo({
  distanceInfo,
  transportMode,
  distanceLoading,
  onToggleTransportMode,
  formatDuration
}) {
  if (!distanceInfo) return null;

  const currentData = transportMode === "DRIVE" ? distanceInfo.driving : distanceInfo.walking;

  return (
    <div className="distance-display">
      <button 
        className="transport-toggle"
        onClick={onToggleTransportMode}
        disabled={distanceLoading}
        title={`Switch to ${transportMode === "DRIVE" ? "walking" : "driving"} mode`}
      >
        <Car className={`icon ${transportMode === "DRIVE" ? "active" : ""}`} />
        <Footprints className={`icon ${transportMode === "WALK" ? "active" : ""}`} />
      </button>
      
      {distanceLoading ? (
        <MoonLoader size={16} color="#1e7a3d" speedMultiplier={0.8} />
      ) : (
        <p>
          {currentData && currentData.distanceMiles != null && currentData.durationMinutes != null ? (
            <>
              From previous activity - <strong>{distanceInfo.previousActivityName}</strong>:{" "}
              {currentData.distanceMiles} mi, {formatDuration(currentData.durationMinutes)}
            </>
          ) : (
            <em>Route could not be computed.</em>
          )}
        </p>
      )}
    </div>
  );
}