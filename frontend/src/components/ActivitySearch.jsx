import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../css/ActivitySearch.css";
import "../css/Popup.css";
import Popup from "../components/Popup";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import {Star, Car, Footprints, Plus, Minus} from "lucide-react";
import {MoonLoader} from "react-spinners";
import {toast} from "react-toastify";
import OverlapWarning from "./OverlapWarning.jsx";
import DistanceAndTimeInfo from "../components/DistanceAndTimeInfo.jsx";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import {getWeather} from "../../api/weather.js";

const BASE_URL = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

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
    allDays = [],
    onActivityAdded,
    onEditActivity,
    username,
    onSingleDayWeather,
    cityQuery: externalCityQuery = "",
    onCityQueryChange 
}) {
    const [query, setQuery] = useState("");
    const [cityQuery, setCityQuery] = useState(externalCityQuery);;
    const [results, setResults] = useState([]);
    const [cityResults, setCityResults] = useState([]);
    const [selectedDay, setSelectedDay] = useState("");
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // popup state
    const [showDetails, setShowDetails] = useState(false);
    const [formStartTime, setFormStartTime] = useState("");
    const [formDuration, setFormDuration] = useState("");
    const [formCost, setFormCost] = useState("");
    const [notes, setNotes] = useState("");
    const [distanceInfo, setDistanceInfo] = useState(null);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [transportMode, setTransportMode] = useState("DRIVE");
    const [distanceLoading, setDistanceLoading] = useState(false);
    const distanceDebounce = useRef(null);
    const distanceCache = useRef({});

    // pending selection
    const [pendingPlace, setPendingPlace] = useState(null);
    const [pendingDayId, setPendingDayId] = useState(null);
    const [saving, setSaving] = useState(false);

    const debounceTimeout = useRef(null);
    const prevCityQuery = useRef("");

    const NYC_BOROUGHS = [
        "Manhattan, New York, NY",
        "Brooklyn, New York, NY",
        "Queens, New York, NY",
        "The Bronx, New York, NY",
        "Staten Island, New York, NY"
    ];

    const {tripId} = useParams();

    const mapPinSvg = "M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0M12 13a2 2 0 1 0 0-4a2 2 0 0 0 0 4";

    const getGreenMapPin = () => {
        if (!window.google) return null;
        
        return {
            path: mapPinSvg,
            fillColor: "#18b374",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#0e8a58",
            scale: 1,
            anchor: new window.google.maps.Point(12, 22),
        };
    };

    const getDarkMapPin = () => {
        if (!window.google) return null;

        return {
            path: mapPinSvg,
            fillColor: "#a8a8a8",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#8c8c8c",
            scale: 1,
            anchor: new window.google.maps.Point(12, 22),
        };
    };

    const itemRefs = useRef([]);    
    const containerStyle = {
        width: '95%',
        height: '100%',
        position: "absolute",
        top: "0px",
        left: "10px",
    };

    //defaults to new york
    const [mapCenter, setMapCenter] = useState({ 
        lat: 40.7128, 
        lng: -74.0060 
    });

    const center = useMemo(() => mapCenter, [mapCenter]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapCenter({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
            );
        }
    }, []);

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

  const dayActivities = useMemo(() => {
    if (!selectedDay || !dayIds.length) return [];
    const dayId = dayIds[selectedDay - 1];
    const day = allDays.find(d => d.day_id === dayId);
    return day?.activities || [];
  }, [selectedDay, dayIds, allDays]);

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

  // toggle between transport modes
  const toggleTransportMode = () => {
    if (distanceLoading || !distanceInfo) return;
    const newMode = transportMode === "DRIVE" ? "WALK" : "DRIVE";
    setTransportMode(newMode);
  };

  const formatDuration = (minutes) => {
    if (minutes == null) return "N/A";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}mins`;
    return `${mins}mins`;
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

    // sync cityQuery with parent component
    useEffect(() => {
        if (onCityQueryChange) {
            onCityQueryChange(cityQuery);
        }
    }, [cityQuery, onCityQueryChange]);

    // init from parent on mount
    useEffect(() => {
        if (externalCityQuery) {
            setCityQuery(externalCityQuery);
            prevCityQuery.current = externalCityQuery;
        }
    }, []);

  //  Search submit with loader
  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedQuery = cityQuery ? `${query} in ${cityQuery}` : query;
    if (combinedQuery.length < 2) {
      setResults([]);
      setNextPageToken(null);
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
      setNextPageToken(res.data.nextPageToken || null);
    } catch (err) {
      console.error("Search error:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDistanceCheck = (startTime) => {
    if (!selectedPlace) return;

    if (distanceDebounce.current) clearTimeout(distanceDebounce.current);

    distanceDebounce.current = setTimeout(() => {
      try {
        const timeToMinutes = (t) => {
          if (!t) return 0;
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };

        const newTime = timeToMinutes(startTime);
        let prevActivity = null;

        for (let i = 0; i < dayActivities.length; i++) {
          const currActivity = dayActivities[i];
          const activityTime = timeToMinutes(currActivity.activity_startTime);

          if (activityTime >= newTime) break;
          prevActivity = currActivity;
        }

        if (!prevActivity) {
          setDistanceInfo(null);
          return;
        }

        const origin = {
          latitude: prevActivity.latitude,
          longitude: prevActivity.longitude,
        };
        const destination = {
          latitude: pendingPlace.location?.latitude,
          longitude: pendingPlace.location?.longitude,
        };

        findDistance(origin, destination, transportMode, prevActivity);
      } catch (err) {
        toast.error("Failed to fetch distance info.");
        console.error("Distance fetch error:", err?.response?.data || err.message);
      }
    }, 2500); 
  };

  // find distance between activities with caching
  async function findDistance(origin, destination, transportation, previousActivity){
    // create cache key
    const cacheKey = `${origin.latitude},${origin.longitude}-${destination.latitude},${destination.longitude}`;
    
    // check if we already have both distances cached
    if (distanceCache.current[cacheKey]?.DRIVE && distanceCache.current[cacheKey]?.WALK) {
      const cached = distanceCache.current[cacheKey];
      setDistanceInfo({
        driving: cached.DRIVE,
        walking: cached.WALK,
        previousActivityName: previousActivity.activity_name,
        prevActivityLat: previousActivity.latitude,
        prevActivityLng: previousActivity.longitude
      });
      return;
    }

    try{
      setDistanceLoading(true);
      
      // fetch both modes in parallel
      const [driveRes, walkRes] = await Promise.all([
        axios.post(`${BASE_URL}/routesAPI/distance/between/activity`, {
          origin,
          destination,
          wayOfTransportation: "DRIVE"
        }),
        axios.post(`${BASE_URL}/routesAPI/distance/between/activity`, {
          origin,
          destination,
          wayOfTransportation: "WALK"
        })
      ]);

      const driveData = {
        distanceMiles: driveRes.data.distanceMiles,
        durationMinutes: Math.round(driveRes.data.durationSeconds / 60)
      };
      
      const walkData = {
        distanceMiles: walkRes.data.distanceMiles,
        durationMinutes: Math.round(walkRes.data.durationSeconds / 60)
      };

      // cache both results
      distanceCache.current[cacheKey] = {
        DRIVE: driveData,
        WALK: walkData
      };

      setDistanceInfo({
        driving: driveData,
        walking: walkData,
        previousActivityName: previousActivity.activity_name,
        prevActivityLat: previousActivity.latitude,
        prevActivityLng: previousActivity.longitude
      });

    } catch (err){
      toast.error("There was an issue trying to compute the distance")
      console.error(err);
    } finally {
      setDistanceLoading(false);
    }
  }
  // Open popup only 
  const handleAddToTrip = (place) => {
    if (!selectedDay) {
      toast.error("Please choose a day first.");
      return;
    }

    setSelectedPlace(place);

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
        setDistanceInfo(null);
        setTransportMode("DRIVE");
        setShowDetails(true);
    };

    // Save details create then update, row is created only after Save
    const handleSaveDetails = async () => {
        if (!pendingPlace || !pendingDayId) {
            toast.error("Something went wrong. Please try again.");
            return;
        }

        let dayDate;
        try {
            const dayObject = allDays.find(d => d.day_id === pendingDayId);

            if (!dayObject) {
                throw new Error("Day object not found");
            }

            dayDate = dayObject.day_date.split("T")[0];

        } catch (err) {
            toast.error("Selected day not found. Please select a different day.");
            setShowDetails(false);
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

            if (createRes.data?.categoryApplied) {
                toast.success("New trip category applied!");
            }
            
            const created = createRes.data?.activity;
            const activityId = created?.activity_id ?? created?.id;
            if (!activityId) {
                toast.error("Activity created but no ID returned.");
                setSaving(false);
                return;
            }

            // Update with details from popup
            const updatePayload = {
                tripId: tripId,
                activityId,
                activity: {
                    startTime: formStartTime || null,
                    duration: formDuration === "" ? null : Number(formDuration),
                    estimatedCost: formCost === "" ? null : Number(formCost),
                    notesForActivity: notes || null, // ok if backend ignores it
                    dayId: pendingDayId
                },
                dayIndex: allDays.findIndex(d => d.day_id === pendingDayId) + 1,
                create: true,
                username: username
            };

            await axios.put(`${BASE_URL}/activities/update`, updatePayload, {
                withCredentials: true,
            });

            if (dayActivities.length === 0){
                try {
                    const weather = await getWeather(
                        address,
                        dayDate,
                        pendingDayId
                    );

                    if (typeof onSingleDayWeather === "function") {
                        onSingleDayWeather({
                            dayId: pendingDayId,
                            date: dayDate,
                            weather,          // { daily_raw: [...], summary: {...} }
                        });
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to load weather data");
                }
            }

            setShowDetails(false);
            setPendingPlace(null);
            setPendingDayId(null);

            onActivityAdded && onActivityAdded(pendingDayId);
            if (window.innerWidth <= 950) {
                onClose && onClose();
            }
        } catch (err) {
            console.error("Save failed:", err?.response?.data || err.message);
            toast.error("Failed to save details. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: MAPS_API_KEY,
    });

    const [map, setMap] = useState(null);
    const [activeMarker, setActiveMarker] = useState(null);

    const onLoad = React.useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    // Effect to fit map bounds to search results
    useEffect(() => {
        if (map && results.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            results.forEach(place => {
                if (place.location?.latitude && place.location?.longitude) {
                    bounds.extend({ 
                        lat: place.location.latitude, 
                        lng: place.location.longitude 
                    });
                }
            });
            map.fitBounds(bounds, { 
                top: 152, 
                right: 0, 
                bottom: 0, 
                left: 0 
            });
        }
    }, [map, results]);

    // go to the activity card when user clicks on map pin
    const handleMarkerClick = (place, index) => {
        setActiveMarker(place);
        const element = itemRefs.current[index];
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    // go to the map pin when a user clicks on the card
    const handleCardClick = (place) => {
        const lat = place.location?.lat ?? place.location?.latitude;
        const lng = place.location?.lng ?? place.location?.longitude;

        if (lat && lng) {
            setActiveMarker(place);
            
            if (map) {
                map.panTo({ lat, lng });
                if (map.getZoom() < 14) {
                    map.setZoom(14);
                }
            }
        }
    };
    
    const handleLoadMore = async () => {
        if (!nextPageToken || loadingMore) return;

        const combinedQuery = cityQuery ? `${query} in ${cityQuery}` : query;

        try {
            setLoadingMore(true);
            const res = await axios.post(
                `${BASE_URL}/placesAPI/search`,
                {
                    query: combinedQuery,

                    // send the token to get next page
                    pageToken: nextPageToken
                },
                { withCredentials: true }
            );

            // append new results to existing ones
            setResults(prev => [...prev, ...(res.data.results || [])]);
            setNextPageToken(res.data.nextPageToken || null);
        } catch (err) {
            console.error("Load more error:", err?.response?.data || err.message);
            toast.error("Failed to load more results");
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <>
            <div className="drawer">
                <button className="collapse-btn" onClick={onClose}>
                    ×
                </button>
                <div className="map-header">
                    {isLoaded && (
                        <div className="map-wrapper">
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={mapCenter}
                                zoom={10}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                                options={{ disableDefaultUI: true, zoomControl: false, clickableIcons: false }}
                            >
                                {results.map((place, idx) => {
                                    const lat = place.location?.lat ?? place.location?.latitude;
                                    const lng = place.location?.lng ?? place.location?.longitude;

                                    if (!lat || !lng) return null;

                                    const isAlreadyOnMap = dayActivities.some(activity => {
                                        //see if we already have the activity on the day
                                        if (activity.google_place_id && place.id && activity.google_place_id === place.id) {
                                            return true;
                                        }

                                        // or get the lat and long
                                        const actLat = activity.latitude ?? activity.location?.latitude;
                                        const actLng = activity.longitude ?? activity.location?.longitude;

                                        // and see if they are super close together
                                        return (
                                            Math.abs(actLat - lat) < 0.0001 &&
                                            Math.abs(actLng - lng) < 0.0001
                                        );
                                    });

                                    if (isAlreadyOnMap) {
                                        return null;
                                    }

                                    return (
                                        <Marker          
                                            key={idx}
                                            position={{ lat, lng }}
                                            onClick={() => handleMarkerClick(place, idx)}
                                            icon={getGreenMapPin()}
                                            title={place.displayName?.text}
                                        />
                                    );
                                })}
                                {dayActivities.map((activity, idx) => {
                                    const lat = activity.latitude ?? activity.location?.latitude;
                                    const lng = activity.longitude ?? activity.location?.longitude;

                                    if (!lat || !lng) return null;

                                    return (
                                        <Marker
                                            key={`existing-${idx}`}
                                            position={{ lat, lng }}
                                            icon={getDarkMapPin()}
                                            title={`Existing: ${activity.activity_name || activity.name}`}
                                            zIndex={50}
                                            onClick={() => onEditActivity(activity)}
                                        />
                                    );
                                })}
                            </GoogleMap>
                            
                            {/* Custom zoom controls */}
                            <div className="custom-zoom-controls">
                                <button onClick={() => map && map.setZoom(map.getZoom() + 1)}><Plus className="custom-control-icon" size={20}></Plus></button>
                                <button onClick={() => map && map.setZoom(map.getZoom() - 1)}><Minus className="custom-control-icon" size={20}></Minus></button>
                            </div>
                        </div>
                    )}
                    <div className="search-form-overlay">
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
                                    {cityQuery.length >= 2 &&
                                        (cityQuery.toLowerCase().includes("new york") ||
                                        cityQuery.toLowerCase().includes("nyc")) &&
                                        !NYC_BOROUGHS.some(b => b.toLowerCase() === cityQuery.toLowerCase()) &&
                                        cityResults.length === 0 &&
                                        cityQuery === prevCityQuery.current && (
                                        <ul className="city-results-dropdown">
                                            {NYC_BOROUGHS.map((b, idx) => (
                                            <li
                                                key={idx}
                                                onClick={() => {
                                                setCityQuery(b);
                                                setCityResults([]);
                                                prevCityQuery.current = b;
                                                }}
                                            >
                                                {b}
                                            </li>
                                            ))}
                                        </ul>
                                        )
                                    }
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
                    </div>
                </div>
                {/*  Loader integrated here */}
                <div className="search-results">
                    {loading ? (
                        <div className="loading-container">
                            <MoonLoader color="var(--accent)" size={50} speedMultiplier={0.9} />
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            {results.map((place, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleCardClick(place)}
                                    className={`activity-card ${activeMarker === place ? "selected-card" : ""}`}
                                    ref={el => (itemRefs.current[idx] = el)}
                                >
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
                            ))}

                            {nextPageToken && (
                                <div className="load-more-container">
                                    <button
                                        className="load-more-btn"
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                    >
                                        {loadingMore ? (
                                            <>
                                                <MoonLoader color="var(--accent)" size={16} />
                                            </>
                                        ) : (
                                            "Load More Results"
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="no-results-text">No results yet. Try a search!</p>
                    )}
                </div>
            </div>

            {/* Popup for activity details */}
            {showDetails && (
                <Popup
                    id="add-activity-popup"
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
                              className={"btn-rightside"}
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
            <DistanceAndTimeInfo
              distanceInfo={distanceInfo}
              transportMode={transportMode}
              distanceLoading={distanceLoading}
              onToggleTransportMode={toggleTransportMode}
              formatDuration={formatDuration}
            />

                    <label className="popup-input" htmlFor="start-time-input">
                        <span>Start time</span>
                        <span>
                            <OverlapWarning
                                formStartTime={formStartTime}
                                formDuration={formDuration}
                                selectedDay={selectedDay}
                                dayIds={dayIds}
                            />
                        </span>
                        <input className = "time-picker"
                            type="time"
                            value={formStartTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormStartTime(val);

                              setDistanceInfo(null);

                              // check if time is fully entered
                              if (/^\d{2}:\d{2}$/.test(val)) {
                                handleDistanceCheck(val);
                              }
                            }}
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
                            onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                    e.preventDefault();
                                }
                            }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val == '') setFormDuration('');
                                else setFormDuration(Math.max(0,val));
                            }}
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
                            step="1"
                            placeholder="e.g. 25"
                            value={formCost}
                            onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') {
                                    e.preventDefault();
                                }
                            }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val == '') setFormCost('');
                                else setFormCost(Math.max(0,Math.floor(val)));
                            }}
                            disabled={saving}
                        />
                    </label>
                </Popup>
            )}
        </>
    );
}
