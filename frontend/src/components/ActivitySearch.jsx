import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/ActivitySearch.css";
import "../css/Popup.css";
import Popup from "../components/Popup";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { Star } from "lucide-react";

const BASE_URL = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

// Normalize Google price level
const toPriceSymbol = (level) => {
  if (level == null) return null;

  switch (level) {
    case "PRICE_LEVEL_FREE":
      return "Free";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default: {
      if (typeof level === "number") return level === 0 ? "Free" : "$".repeat(Math.min(level, 4));
      const s = String(level);
      if (/^(\$+|Free)$/i.test(s)) return s.length > 6 ? s.slice(0, 6) : s;
      return s.slice(0, 6);
    }
  }
};

export default function ActivitySearch({
  onClose,
  days,
  dayIds = [],                 // array of DB day_id (index 0 => Day 1)
  onActivityAdded,             // refresh after save
}) {
  const [query, setQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [creating, setCreating] = useState(false);

  // popup state
  const [showDetails, setShowDetails] = useState(false);
  const [newActivityId, setNewActivityId] = useState(null);
  const [formStartTime, setFormStartTime] = useState("");  // "HH:MM"
  const [formDuration, setFormDuration] = useState("");    // minutes
  const [formCost, setFormCost] = useState("");            // number

  const debounceTimeout = useRef(null);
  const prevCityQuery = useRef("");

  const priceLevelDisplay = (level) => {
    switch (level) {
      case "PRICE_LEVEL_FREE":
        return "Free";
      case "PRICE_LEVEL_INEXPENSIVE":
        return "$";
      case "PRICE_LEVEL_MODERATE":
        return "$$";
      case "PRICE_LEVEL_EXPENSIVE":
        return "$$$";
      case "PRICE_LEVEL_VERY_EXPENSIVE":
        return "$$$$";
      default:
        if (typeof level === "number") return level === 0 ? "Free" : "$".repeat(Math.min(level, 4));
        if (typeof level === "string" && level.startsWith("$")) return level;
        return "N/A";
    }
  };

  const formatType = (type) => {
    if (!type) return "N/A";
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getLocationString = (place) => {
    const city =
      place.addressComponents?.find((c) => c.types.includes("locality"))
        ?.longText || "N/A";
    const state =
      place.addressComponents?.find((c) =>
        c.types.includes("administrative_area_level_1")
      )?.shortText || "N/A";
    const country =
      place.addressComponents?.find((c) => c.types.includes("country"))
        ?.shortText || "N/A";
    return `${city}, ${state}, ${country}`;
  };

  // City autocomplete
  useEffect(() => {
    if (cityQuery.length < 2 || cityQuery === prevCityQuery.current) {
      setCityResults([]);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/placesAPI/cityAutocomplete`,
          { query: cityQuery },
          { withCredentials: true }
        );
        const suggestions = res.data.result?.suggestions || [];
        setCityResults(suggestions.slice(0, 5));
        prevCityQuery.current = cityQuery;
      } catch (err) {
        console.error("Autocomplete error:", err?.response?.data || err.message);
      }
    }, 800);

    return () => clearTimeout(debounceTimeout.current);
  }, [cityQuery]);

  // Search submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedQuery = cityQuery ? `${query} in ${cityQuery}` : query;
    if (combinedQuery.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await axios.post(
        `${BASE_URL}/placesAPI/search`,
        { query: combinedQuery },
        { withCredentials: true }
      );
      setResults(res.data.results || []);
    } catch (err) {
      console.error("Search error:", err?.response?.data || err.message);
    }
  };

  // Add to Trip, create then open popup
  const handleAddToTrip = async (place) => {
    if (!selectedDay) {
      alert("Please choose a day first.");
      return;
    }

    // map Day 1..N to actual DB day_id
    const idx = Number(selectedDay) - 1;
    const dayId = dayIds[idx];

    if (!dayId) {
      alert("Could not resolve the selected day. Please refresh and try again.");
      return;
    }

    const name = place.displayName?.text || "Activity";
    const address = getLocationString(place);
    const type = place.primaryType || null;
    const priceLevel = toPriceSymbol(place.priceLevel);
    const rating = place.rating ?? null;
    const lat = place.location?.lat ?? place.location?.latitude ?? null;
    const lng = place.location?.lng ?? place.location?.longitude ?? null;

    const payload = {
      day: dayId,
      activity: {
        name,
        address,
        type,
        priceLevel,
        rating,
        longitude: lng,
        latitude: lat,
        // time/duration/cost will be set in popup via /activities/update
      },
    };

    try {
      setCreating(true);
      const res = await axios.post(
        `${BASE_URL}/activities/create`,
        payload,
        { withCredentials: true }
      );

      const created = res.data?.activity;
      // backend returns activity_id 
      const id = created?.activity_id ?? created?.id;
      if (!id) {
        console.warn("Created activity but did not receive an ID:", created);
        alert("Activity created, but could not open details.");
        setCreating(false);
        return;
      }

      // Save id and open details popup
      setNewActivityId(id);
      setFormStartTime("");
      setFormDuration("");
      setFormCost("");
      setShowDetails(true);
    } catch (err) {
      console.error("Error adding activity:", err?.response?.data || err.message);
      alert("Failed to add activity. Check server logs for details.");
    } finally {
      setCreating(false);
    }
  };

  // Save details
  const handleSaveDetails = async () => {
    try {
      const updatePayload = {
        activityId: newActivityId,
        activity: {
          startTime: formStartTime || null,
          duration: formDuration === "" ? null : Number(formDuration),
          estimatedCost: formCost === "" ? null : Number(formCost),
        },
      };

      await axios.put(
        `${BASE_URL}/activities/update`,
        updatePayload,
        { withCredentials: true }
      );

      setShowDetails(false);
      setNewActivityId(null);

      onActivityAdded && onActivityAdded();
    } catch (err) {
      console.error("Error updating activity:", err?.response?.data || err.message);
      alert("Failed to save details. Please try again.");
    }
  };

  return (
    <>
      <div className="drawer">
        <button className="collapse-btn" onClick={onClose}>
          ×
        </button>

        <h2 className="search-title">Add Activities</h2>

        <form onSubmit={handleSubmit}>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search activity type..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="city-autocomplete-wrapper">
              <input
                type="text"
                placeholder="Enter location..."
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
              />
              {cityResults.length > 0 && (
                <ul className="city-results-dropdown">
                  {cityResults.map((suggestion, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        const selectedCity =
                          suggestion.placePrediction?.text?.text || "";
                        setCityQuery(selectedCity);
                        setCityResults([]);
                        prevCityQuery.current = selectedCity;
                      }}
                    >
                      {suggestion.placePrediction?.text?.text || ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="search-actions">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
            >
              <option value="">Any Day</option>
              {[...Array(days)].map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {`Day ${idx + 1}`}
                </option>
              ))}
            </select>
            <button type="submit" className="search-btn">
              Search
            </button>
          </div>
        </form>

        <div className="search-results">
          {results.map((place, idx) => (
            <div key={idx} className="activity-card">
              <div className="card-content">
                <h3>{place.displayName?.text}</h3>
                <p className="detail">{getLocationString(place)}</p>
                <p className="detail">Type: {formatType(place.primaryType)}</p>
                <p className="price">{priceLevelDisplay(place.priceLevel)}</p>
                <p className="detail">
                  {place.rating !== undefined ? (
                    <span className="stars">
                      <Star className="star" size={16} fill="currentColor" />
                      {` ${place.rating}`}
                    </span>
                  ) : (
                    "No ratings available"
                  )}
                </p>
              </div>

              <div className="card-actions">
                {place.websiteUri ? (
                  <a
                    href={place.websiteUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="website-link"
                  >
                    Website
                  </a>
                ) : (
                  <span className="website-link disabled">No website</span>
                )}
                <button
                  className="add-btn"
                  onClick={() => handleAddToTrip(place)}
                  disabled={creating}
                >
                  {creating ? "Adding..." : "Add to Trip"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDetails && (
        <Popup
          title="Add Activity Details"
          buttons={
            <>
              <button type="button" onClick={() => setShowDetails(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveDetails}>
                Save
              </button>
            </>
          }
        >
          <label className="popup-input">
            <span>Start time</span>
            <input
              type="time"
              value={formStartTime}
              onChange={(e) => setFormStartTime(e.target.value)}
            />
          </label>

          <label className="popup-input">
            <span>Duration (minutes)</span>
            <input
              type="number"
              min="0"
              placeholder="e.g. 90"
              value={formDuration}
              onChange={(e) => setFormDuration(e.target.value)}
            />
          </label>

          <label className="popup-input">
            <span>Estimated cost ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 25"
              value={formCost}
              onChange={(e) => setFormCost(e.target.value)}
            />
          </label>
        </Popup>
      )}
    </>
  );
}
