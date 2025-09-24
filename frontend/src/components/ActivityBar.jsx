import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../css/ActivityAutoComplete.css";

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

export default function ActivityBar() {
  const { tripId } = useParams();
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
    // get city, state, country from addressComponents
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

  useEffect(() => {
    // only call API if query is long enough and hasn't already been used
    if (cityQuery.length < 2 || cityQuery === prevCityQuery.current) {
      setCityResults([]);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.post(
          "http://localhost:3000/placesAPI/cityAutocomplete",
          { query: cityQuery }
        );
        const suggestions = res.data.result?.suggestions || [];
        setCityResults(suggestions.slice(0, 1));
        prevCityQuery.current = cityQuery; // remember last query sent
      } catch (err) {
        console.error(err);
      }
    }, 1100); // debounce delay

    return () => clearTimeout(debounceTimeout.current);
  }, [cityQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedQuery = cityQuery ? `${query} in ${cityQuery}` : query;
    if (combinedQuery.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await axios.post(
        "http://localhost:3000/placesAPI/search",
        { query: combinedQuery }
      );
      setResults(res.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToTrip = async (place) => {
    if (!selectedDay) return;
    try {
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-container">
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
                prevCityQuery.current = selectedCity; // prevent API call after selection
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
          <option key={day} value={idx + 1}>{day}</option>
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
