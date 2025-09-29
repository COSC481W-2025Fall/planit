import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/styles.css";
import { Star } from "lucide-react";

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL
  : import.meta.env.VITE_LOCAL_BACKEND_URL;

export default function PlacesTest() {
  const [open, setOpen] = useState(false);

  return (
    <div className="trip-page">
      {!open && (
        <div className="expand-container">
          <button className="expand-btn" onClick={() => setOpen(true)}>
            Search Activities
          </button>
        </div>
      )}
      {open && (
        <>
          {/* Overlay */}
          <div className="overlay" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <ActivitiesSearch onClose={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}

function ActivitiesSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
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
        const res = await axios.post(`${BASE_URL}/placesAPI/cityAutocomplete`, {
          query: cityQuery,
        });
        const suggestions = res.data.result?.suggestions || [];
        setCityResults(suggestions.slice(0, 5));
        prevCityQuery.current = cityQuery;
      } catch (err) {
        console.error("Autocomplete error:", err.message);
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
      const res = await axios.post(`${BASE_URL}/placesAPI/search`, {
        query: combinedQuery,
      });
      setResults(res.data.results || []);
    } catch (err) {
      console.error("Search error:", err.message);
    }
  };

  return (
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
            {DAYS.map((day, idx) => (
              <option key={day} value={idx + 1}>
                {day}
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
              <button className="add-btn">Add to Trip</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
