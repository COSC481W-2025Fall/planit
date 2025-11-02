import React, { useEffect, useMemo, useRef, useState } from "react";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import TripCardPublic from "../components/TripCardPublic";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../css/ExplorePage.css";

export default function ExplorePage() {
  // auth
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // tabs
  const [tab, setTab] = useState("discover"); // "discover" | "liked"

  // datasets
  const [trending, setTrending] = useState([]);
  const [topLiked, setTopLiked] = useState([]); // Top 10 all-time
  const [results, setResults] = useState([]);
  const [likedTrips, setLikedTrips] = useState([]); // Liked tab grid

  // likes
  const [likedIds, setLikedIds] = useState(new Set());
  const [liking, setLiking] = useState(new Set());
  const isLiked = (id) => likedIds.has(id);

  // search
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  // backend base
  const BASE = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
  const JSON_HEADERS = { "Content-Type": "application/json" };

  // helpers
  const safe = (x) => (Array.isArray(x) ? x : []);
  const post = async (path, body = {}) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(path);
    return res.json();
  };

  // API
  const api = {
    getUser: async () => {
      const res = await fetch(`${BASE}/auth/login/details`, {
        credentials: "include",
      });
      return res.json();
    },
    getAllTripLocations: () => post(`/explore/all/trip/locations`),
    getTrendingTrips: (userId) => post(`/explore/trending`, { userId }),
    getTopLikedTrips: (userId) => post(`/explore/top/liked/trips`, { userId }),
    searchTrips: (location, userId) => post(`/explore/search`, { location, userId }),
    toggleLike: ({ userId, tripId }) => post(`/likes/toggle`, { userId, tripId }),
    getLikedTripsByUser: (userId) => post(`/likes/all/trip/details`, { userId }),
  };

  // navigate to trip details
  const handleOpenTrip = (tripId) => navigate(`/days/${tripId}`);

  // autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return safe(locations)
      .map((r) => r.trip_location)
      .filter(Boolean)
      .filter((loc) => loc.toLowerCase().includes(q))
      .slice(0, 8);
  }, [locations, query]);

  // fetch user
  useEffect(() => {
    api
      .getUser()
      .then((data) => {
        if (data?.loggedIn !== false) setUser({ ...data });
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  // initial content (locations + trending + top 10)
  useEffect(() => {
    const userId = user?.user_id ?? 0;
    if (loadingUser) return;

    (async () => {
      try {
        const [locs, trendingRes, topRes] = await Promise.all([
          api.getAllTripLocations(),
          api.getTrendingTrips(userId),
          api.getTopLikedTrips(userId),
        ]);

        const safeLocs = safe(locs);
        const safeTrending = safe(trendingRes);
        const safeTop = safe(topRes);

        setLocations(safeLocs);
        setTrending(safeTrending);
        setTopLiked(safeTop);

        // seed liked set from flags at load time
        const seed = new Set([
          ...safeTrending.filter((t) => t.is_liked).map((t) => t.trips_id),
          ...safeTop.filter((t) => t.is_liked).map((t) => t.trips_id),
        ]);
        setLikedIds(seed);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load explore content.");
      }
    })();
  }, [user?.user_id, loadingUser]);

  // refetch liked trips when opening Liked tab or likes change
  useEffect(() => {
    if (tab !== "liked" || !user?.user_id) return;
    api
      .getLikedTripsByUser(user.user_id)
      .then((rows) => setLikedTrips(safe(rows)))
      .catch(() => setLikedTrips([]));
  }, [tab, user?.user_id, likedIds]);

  // debounced search
  useEffect(() => {
    const userId = user?.user_id ?? 0;
    if (!query) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const rows = await api.searchTrips(query, userId);
        const safeRows = safe(rows);
        setResults(safeRows);
        if (safeRows.length) {
          setLikedIds((prev) => {
            const next = new Set(prev);
            safeRows.forEach((r) => r.is_liked && next.add(r.trips_id));
            return next;
          });
        }
      } catch {
        toast.error("Search failed.");
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query, user?.user_id]);

  // like toggle
  const handleToggleLike = async (tripId) => {
    if (!user?.user_id) {
      toast.info("Log in to like trips.");
      return;
    }
    if (liking.has(tripId)) return;

    setLiking((prev) => new Set(prev).add(tripId));
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(tripId) ? next.delete(tripId) : next.add(tripId);
      return next;
    });

    try {
      const res = await api.toggleLike({ userId: user.user_id, tripId });
      setLikedIds((prev) => {
        const next = new Set(prev);
        res?.liked ? next.add(tripId) : next.delete(tripId);
        return next;
      });
    } catch {
      // revert
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.has(tripId) ? next.delete(tripId) : next.add(tripId);
        return next;
      });
      toast.error("Could not update like.");
    } finally {
      setLiking((prev) => {
        const n = new Set(prev);
        n.delete(tripId);
        return n;
      });
    }
  };

  // carousel scroll helper (card width + gap)
  function scrollByOneCard(viewportRef, dir = 1) {
    const vp = viewportRef.current;
    if (!vp) return;
    const track = vp.querySelector(":scope > .carousel-track");
    const firstCard = track?.firstElementChild;
    const gap = track ? parseInt(getComputedStyle(track).gap || "15", 10) : 15;
    const cardW = firstCard ? firstCard.clientWidth : 300;
    const delta = dir * (cardW + gap);
    vp.scrollBy({ left: delta, behavior: "smooth" });
  }

  // carousel refs
  const resRef = useRef(null);
  const trRef = useRef(null);
  const topRef = useRef(null);

  // loading
  if (loadingUser) {
    return (
      <div className="trip-page">
        <TopBanner user={user} />
        <div className="content-with-sidebar">
          <NavBar />
          <div className="main-content">
            <div className="page-loading-container">
              <MoonLoader size={70} speedMultiplier={0.9} data-testid="loader" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-page explore-page">
      <TopBanner user={user} />
      <div className="content-with-sidebar">
        <NavBar />

        <div className="main-content">
          {/* Header */}
          <div className="trips-header">
            <div className="trips-title-section">
              <div className="trips-title">Explore trips</div>
              <div className="trips-subtitle">Find inspiration from public itineraries</div>
            </div>
          </div>

          {/* Tabs (pill style) */}
          <div className="tabbar">
            <button
              type="button"
              className={`pill ${tab === "discover" ? "active" : ""}`}
              onClick={() => setTab("discover")}
            >
              Discover
            </button>
            <button
              type="button"
              className={`pill ${tab === "liked" ? "active" : ""}`}
              onClick={() => setTab("liked")}
            >
              Liked
            </button>
          </div>

          {/* Search */}
          <div className="explore-search closer">
            <div className="search-input-wrap">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by location"
              />
            </div>
            {suggestions.length > 0 && (
              <ul className="autocomplete">
                {suggestions.map((s, i) => (
                  <li key={i} onClick={() => setQuery(s)}>
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {tab === "discover" ? (
            <>
              {query && (
                <section className="trips-section">
                  <div className="section-title">Search results</div>

                  <div className="carousel">
                    <button
                      className="carousel-btn prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollByOneCard(resRef, -1);
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="carousel-viewport" ref={resRef}>
                      <div className="carousel-track">
                        {results.length === 0 ? (
                          <div className="empty-state" style={{ padding: "8px 12px", color: "#666" }}>
                            No public trips match “{query}”.
                          </div>
                        ) : (
                          results.map((t) => (
                            <TripCardPublic
                              key={`s-${t.trips_id}`}
                              trip={t}
                              liked={isLiked(t.trips_id)}
                              onToggleLike={handleToggleLike}
                              onOpen={handleOpenTrip}
                            />
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      className="carousel-btn next"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollByOneCard(resRef, 1);
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </section>
              )}

              {/* Trending carousel */}
              <section className="trips-section">
                <div className="section-title">Trending this week</div>

                <div className="carousel">
                  <button
                    className="carousel-btn prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollByOneCard(trRef, -1);
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="carousel-viewport" ref={trRef}>
                    <div className="carousel-track">
                      {trending.map((t) => (
                        <TripCardPublic
                          key={`tr-${t.trips_id}`}
                          trip={t}
                          liked={isLiked(t.trips_id)}
                          onToggleLike={handleToggleLike}
                          onOpen={handleOpenTrip}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className="carousel-btn next"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollByOneCard(trRef, 1);
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </section>

              {/* Top 10 all-time carousel */}
              <section className="trips-section">
                <div className="section-title">Top trips of all-time</div>
                <div className="carousel">
                  <button
                    className="carousel-btn prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollByOneCard(topRef, -1);
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="carousel-viewport" ref={topRef}>
                    <div className="carousel-track">
                      {safe(topLiked).length === 0 ? (
                        <div className="empty-state" style={{ padding: "8px 12px", color: "#666" }}>
                          No top trips yet.
                        </div>
                      ) : (
                        safe(topLiked).map((t) => (
                          <TripCardPublic
                            key={`tl-${t.trips_id}`}
                            trip={t}
                            liked={isLiked(t.trips_id)}
                            onToggleLike={handleToggleLike}
                            onOpen={handleOpenTrip}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    className="carousel-btn next"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollByOneCard(topRef, 1);
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </section>
            </>
          ) : (
            // Liked tab: grid layout
            <section className="trips-section">
              <div className="section-title">Your liked trips</div>
              <div className="liked-grid">
                {likedTrips.length === 0 ? (
                  <div className="empty-state" style={{ padding: "8px 12px", color: "#666" }}>
                    You haven’t liked any trips yet.
                  </div>
                ) : (
                  likedTrips.map((t) => (
                    <TripCardPublic
                      key={`lk-${t.trips_id}`}
                      trip={t}
                      liked={true}
                      onToggleLike={handleToggleLike}
                      onOpen={handleOpenTrip}
                    />
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
