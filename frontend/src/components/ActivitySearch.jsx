import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/ActivitySearch.css";
import "../css/Popup.css";
import Popup from "../components/Popup";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { Star } from "lucide-react";
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";


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
      if (typeof level === "number")
        return level === 0 ? "Free" : "$".repeat(Math.min(level, 4));
      const s = String(level);
      if (/^(\$+|Free)$/i.test(s)) return s.length > 6 ? s.slice(0, 6) : s;
      return s.slice(0, 6);
    }
  }
};

export default function ActivitySearch({
  onClose,
  days,
  dayIds = [],
  onActivityAdded,
}) {
  const [query, setQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ New state for loader

  // popup state
  const [showDetails, setShowDetails] = useState(false);
  const [formStartTime, setFormStartTime] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formCost, setFormCost] = useState("");
  const [notes, setNotes] = useState("");

  // pending selection 
  const [pendingPlace, setPendingPlace] = useState(null);
  const [pendingDayId, setPendingDayId] = useState(null);
  const [saving, setSaving] = useState(false);

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
        if (typeof level === "number")
          return level === 0 ? "Free" : "$".repeat(Math.min(level, 4));
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
    const addr = place.addressComponents || [];

    const country =
      addr.find((c) => c && c.types?.includes("country"))?.shortText || "N/A";

    const region =
      addr.find((c) => c && c.types?.includes("administrative_area_level_1"))
        ?.shortText ||
      addr.find((c) => c && c.types?.includes("administrative_area_level_2"))
        ?.shortText ||
      addr.find((c) => c && c.types?.includes("sublocality"))?.shortText ||
      "N/A";

    const city =
      addr.find((c) => c && c.types?.includes("locality"))?.longText ||
      addr.find((c) => c && c.types?.includes("sublocality"))?.longText ||
      addr.find((c) => c && c.types?.includes("neighborhood"))?.longText ||
      region;

    return [city, region, country]
      .filter((v) => v && v !== "N/A")
      .join(", ");
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

  //  Search submit with loader
  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedQuery = cityQuery ? `${query} in ${cityQuery}` : query;
    if (combinedQuery.length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/placesAPI/search`,
        { query: combinedQuery },
        { withCredentials: true }
      );
      setResults(res.data.results || []);
    } catch (err) {
      console.error("Search error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open popup only 
  const handleAddToTrip = (place) => {
    if (!selectedDay) {
      toast.error("Please choose a day first.");
      return;
    }

    const idx = Number(selectedDay) - 1;
    const dayId = dayIds[idx];
    if (!dayId) {
      alert("Could not resolve selected day. Please refresh and try again.");
      toast.error("Could not resolve the selected day. Please refresh and try again.");
      return;
    }

    setPendingPlace(place);
    setPendingDayId(dayId);

    // reset form & open popup
    setFormStartTime("");
    setFormDuration("");
    setFormCost("");
    setNotes("");
    setShowDetails(true);
  };

  // Save details create then update, row is created only after Save
  const handleSaveDetails = async () => {
    if (!pendingPlace || !pendingDayId) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    // Build payload from the selected place
    const place = pendingPlace;
    const name = place.displayName?.text || "Activity";
    const address = getLocationString(place);
    const type = place.primaryType || null;
    const priceLevel = toPriceSymbol(place.priceLevel);
    const rating = place.rating ?? null;
    const lat = place.location?.lat ?? place.location?.latitude ?? null;
    const lng = place.location?.lng ?? place.location?.longitude ?? null;
    const website = place.websiteUri || null;

    const createPayload = {
      day: pendingDayId,
      activity: {
        name,
        address,
        type,
        priceLevel,
        rating,
        longitude: lng,
        latitude: lat,
        website,
        // time/duration/cost will be set in popup via /activities/update
      },
    };

    setSaving(true);
    try {
      // Create the activity
      const createRes = await axios.post(
        `${BASE_URL}/activities/create`,
        createPayload,
        { withCredentials: true }
      );
      const created = createRes.data?.activity;
      const activityId = created?.activity_id ?? created?.id;
      if (!activityId) {
        toast.error("Activity created but no ID returned.");
        setSaving(false);
        return;
      }

      // Update with details from popup
      const updatePayload = {
        activityId,
        activity: {
          startTime: formStartTime || null,
          duration: formDuration === "" ? null : Number(formDuration),
          estimatedCost: formCost === "" ? null : Number(formCost),
          notesForActivity: notes || null, // ok if backend ignores it
        },
      };

      await axios.put(`${BASE_URL}/activities/update`, updatePayload, {
        withCredentials: true,
      });

      toast.success("Activity added!");
      setShowDetails(false);
      setPendingPlace(null);
      setPendingDayId(null);

      onActivityAdded && onActivityAdded();
    } catch (err) {
      console.error("Save failed:", err?.response?.data || err.message);
      toast.error("Failed to save details. Please try again.");
    } finally {
      setSaving(false);
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

        {/*  Loader integrated here */}
        <div className="search-results">
          {loading ? (
            <div className="loading-container">
              <MoonLoader color="var(--accent)" size={50} speedMultiplier={0.9} />
            </div>
          ) : results.length > 0 ? (
            results.map((place, idx) => (
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
                    Add to Trip
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results-text">No results yet. Try a search!</p>
          )}
        </div>
      </div>

      {/* Popup for activity details */}
      {showDetails && (
        <Popup
          title="Add Activity Details"
          buttons={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  setPendingPlace(null);
                  setPendingDayId(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={saving}
                style={{
                  opacity: saving ? 0.5 : 1,
                  pointerEvents: saving ? "none" : "auto",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "opacity 0.3s ease"
                }}
              >
                {saving ? "Saving..." : "Save"}
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
              disabled={saving}
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
              disabled={saving}
            />
          </label>

          <label className="popup-input">
            <span>Notes</span>
            <textarea
              className="textarea-notes"
              maxLength={200}
              placeholder="Enter any notes you have about your activity!"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
            />
            <div className="char-count">{notes.length} / 200</div>
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
              disabled={saving}
            />
          </label>
        </Popup>
      )}
    </>
  );
}
