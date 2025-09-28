import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/styles.css"; // keep using your old styling

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

// ✅ read env vars from Vite (.env inside frontend/)
const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_BACKEND_URL   // deployed backend
  : import.meta.env.VITE_LOCAL_BACKEND_URL; // local backend

export default function PlacesTest() {
  const [query, setQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const debounceTimeout = useRef(null);
  const prevCityQuery = useRef("");

  const priceLevelDisplay = (level) => {
    switch (level) {
      case "PRICE_LEVEL_FREE": return "Free";
      case "PRICE_LEVEL_INEXPENSIVE": return "$";
      case "PRICE_LEVEL_MODERATE": return "$$";
      case "PRICE_LEVEL_EXPENSIVE": return "$$$";
      case "PRICE_LEVEL_VERY_EXPENSIVE": return "$$$$";
      default: return "N/A";
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
        setCityResults(suggestions.slice(0, 1));
        prevCityQuery.current = cityQuery;
      } catch (err) {
        console.error("Autocomplete error:", err.message);
      }
    }, 1100);

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
    <div className="activities-search">
      <h2 className="search-title">Add Activities</h2>

      <form onSubmit={handleSubmit}>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for activity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            type="text"
            placeholder="Search in city..."
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
          />
          {cityResults.length > 0 && (
            <ul className="city-results-dropdown">
              <li
                onClick={() => {
                  const selectedCity =
                    cityResults[0].placePrediction?.text?.text || "";
                  setCityQuery(selectedCity);
                  setCityResults([]);
                  prevCityQuery.current = selectedCity;
                }}
              >
                {cityResults[0].placePrediction?.text?.text || ""}
              </li>
            </ul>
          )}
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
            <h3>{place.displayName?.text}</h3>
            <p className="detail">{getLocationString(place)}</p>
            <p className="detail">Type: {formatType(place.primaryType)}</p>
            <p className="price">{priceLevelDisplay(place.priceLevel)}</p>
            <p className="detail">
              {place.rating !== undefined
                ? `★ ${place.rating}`
                : "No ratings available"}
            </p>
            {place.websiteUri ? (
              <a
                href={place.websiteUri}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
            ) : (
              <span>No website available</span>
            )}
            <button className="add-btn">+ Add to Trip</button>
          </div>
        ))}
      </div>
    </div>
  );
}
