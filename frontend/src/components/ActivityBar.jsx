import React, { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../css/ActivityAutoComplete.css";

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

export default function ActivityBar() {
  const { tripId } = useParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");

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
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // helper function to get "City, State, Country" string
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

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/placesAPI/search",
        { query }
      );
      setResults(res.data.results || []);
      console.log("Form submitted:", { query, selectedDay });
    } catch (err) {
      console.log("Search failed");
      console.error(err);
    }
  };

  const handleAddToTrip = async (place) => {
    try {
      if (!selectedDay) return;
      const dayNumber = parseInt(selectedDay.replace("Day ", ""), 10);
      await axios.post("http://localhost:3000/activities/create", {
        tripId,
        day: selectedDay,
        activity: {
          name: place.displayName?.text,
          address: getLocationString(place), 
          type: formatType(place.primaryType),
          priceLevel: priceLevelDisplay(place.priceLevel),
          longitude: place.location?.longitude,
          latitude: place.location?.latitude,
          rating: place.rating,
        },
      });
      console.log(`${place.displayName?.text} added to ${selectedDay}!`);
    } catch (err) {
      console.error(err);
      console.log("Failed to add activity to trip");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleChange}
        />
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          <option value="">Any Day</option>
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      {results.length > 0 && (
        <ul className="results-container">
          {results.map((place, idx) => (
            <li key={idx} className="result-card">
              <strong>{place.displayName?.text}</strong>
              <p>{getLocationString(place)}</p>
              <p>Type: {formatType(place.primaryType)}</p>
              <p className="price-level">
                Price Level: {priceLevelDisplay(place.priceLevel)}
              </p>
              <p>
                {place.rating !== undefined
                  ? `Rating: ${place.rating}`
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
                  "No website available"
                )}
              <button
                type="button"
                onClick={() => handleAddToTrip(place)}
                className="add-to-trip-btn"
                disabled={!selectedDay}
              >
                {selectedDay ? `Add to ${selectedDay}` : "Select a day first"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="submit">Search</button>
    </form>
  );
}
