import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function PlacesTest() {
  const [activityQuery, setActivityQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [results, setResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef(null);
  const prevCityQuery = useRef("");

  // Helpers
  const priceLevelDisplay = (level) => {
    switch (level) {
      case "PRICE_LEVEL_FREE": return "Free";
      case "PRICE_LEVEL_INEXPENSIVE": return "$";
      case "PRICE_LEVEL_MODERATE": return "$$";
      case "PRICE_LEVEL_EXPENSIVE": return "$$$";
      case "PRICE_LEVEL_VERY_EXPENSIVE": return "$$$$";
      default: return "";
    }
  };

  const formatType = (type) =>
    type
      ? type
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "";

  const getLocationString = (place) => {
    const city =
      place.addressComponents?.find((c) => c.types.includes("locality"))
        ?.longText || "";
    const state =
      place.addressComponents?.find((c) =>
        c.types.includes("administrative_area_level_1")
      )?.shortText || "";
    const country =
      place.addressComponents?.find((c) => c.types.includes("country"))
        ?.shortText || "";
    return [city, state, country].filter(Boolean).join(", ");
  };

  // Autocomplete
  useEffect(() => {
    if (cityQuery.length < 2 || cityQuery === prevCityQuery.current) {
      setCityResults([]);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await axios.post("http://localhost:5000/placesAPI/cityAutocomplete", {
          query: cityQuery,
        });
        const suggestions = res.data.result?.suggestions || [];
        setCityResults(suggestions.slice(0, 5));
        prevCityQuery.current = cityQuery;
      } catch (err) {
        console.error(err);
      }
    }, 800);

    return () => clearTimeout(debounceTimeout.current);
  }, [cityQuery]);

  // Handle Search 
  const handleSearch = async () => {
    const combinedQuery = cityQuery ? `${activityQuery} in ${cityQuery}` : activityQuery;
    if (combinedQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/placesAPI/search", {
        query: combinedQuery,
      });
      setResults(res.data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="trip-page">
        <div className="trip-itinerary">
          <h2>Itinerary (placeholder)</h2>
        </div>

        <div className="activities-search">
          <h2 className="search-title">Test Google Places API</h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search activity type..."
              value={activityQuery}
              onChange={(e) => setActivityQuery(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter location..."
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
            />

            {/* Autocomplete dropdown */}
            {cityResults.length > 0 && (
              <ul className="city-results-dropdown">
                {cityResults.map((suggestion, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      const selectedCity = suggestion.placePrediction?.text?.text || "";
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

            <button className="search-btn" onClick={handleSearch}>
              Search
            </button>
          </div>

          {loading && <p>Loading...</p>}

          <div className="search-results">
            {results.map((place, idx) => (
              <div key={idx} className="activity-card">
                <h3>{place.displayName?.text}</h3>
                <p className="detail">{getLocationString(place)}</p>
                <p className="detail">Type: {formatType(place.primaryType)}</p>
                {place.rating && <p className="detail"> ★ {place.rating}</p>}
                <p className="price">{priceLevelDisplay(place.priceLevel)}</p>
                {place.websiteUri && (
                  <a href={place.websiteUri} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}
                <button className="add-btn">+ Add to Trip</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
