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

  // central like-count store
  const [likeCounts, setLikeCounts] = useState(new Map());

  const [isAddCooldown, setIsAddCooldown] = useState(false);

  // search
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // autocomplete UI
  const [showSuggestions, setShowSuggestions] = useState(false);
  const prevSearchRef = useRef("");
  const acWrapRef = useRef(null);
  const searchAbortRef = useRef(null);
  const resRef = useRef(null);
  const trRef = useRef(null);
  const topRef = useRef(null);

  const SEARCH_DEBOUNCE_MS = 800;
  const MIN_LEN = 2;

  const [carouselCooldown, setCarouselCooldown] = useState(false);
  const CAROUSEL_COOLDOWN_MS = 350; // adjust between 250–400ms

  const navigate = useNavigate();

  // backend base
  const BASE = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
  const JSON_HEADERS = { "Content-Type": "application/json" };

  // helpers
  const safe = (x) => (Array.isArray(x) ? x : []);
  const toInt = (v) => (v == null ? 0 : Number(v) || 0);
  const applyLikeToggle = (tripId, willLike) => {
    setLikeCounts((prev) => {
      const next = new Map(prev);
      const cur = toInt(next.get(tripId));
      const nextVal = willLike ? cur + 1 : (cur > 0 ? cur - 1 : 0);
      next.set(tripId, nextVal);
      return next;
    });
  };

  // collect counts 
  const ingestCounts = (rows) => {
    setLikeCounts((prev) => {
      const next = new Map(prev);
      safe(rows).forEach((r) => {
        if (!r || r.trips_id == null) return;
        if (Object.prototype.hasOwnProperty.call(r, "like_count")) {
          next.set(r.trips_id, toInt(r.like_count));
        }
      });
      return next;
    });
  };

  // get display count
  const getLikeCount = (tripId, fallback) =>
    likeCounts.has(tripId) ? likeCounts.get(tripId) : toInt(fallback);

  // POST helper 
  const post = async (path, body = {}, opts = {}) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
      signal: opts.signal,
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
    searchTrips: (location, userId, opts) =>
      post(`/explore/search`, { location, userId }, opts),
    toggleLike: ({ userId, tripId }) => post(`/likes/toggle`, { userId, tripId }),
    getLikedTripsByUser: (userId) => post(`/likes/all/trip/details`, { userId }),
  };

  // navigate to trip details
  const handleOpenTrip = (tripId) => 
  navigate(`/days/${tripId}?fromExplore=true`);

  // autocomplete suggestions
  const suggestions = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return locations
      .map((r) => r.trip_location)
      .filter(Boolean)
      .filter((loc) => loc.toLowerCase().includes(q))
      .slice(0, 8);
  }, [locations, query]);

  // click-outside to close suggestions
  useEffect(() => {
    const onDocClick = (e) => {
      if (acWrapRef.current && !acWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

        ingestCounts([...safeTrending, ...safeTop]);
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
    let cancelled = false;
    api
      .getLikedTripsByUser(user.user_id)
      .then((rows) => {
        if (cancelled) return;
        const safeRows = safe(rows);
        setLikedTrips(safeRows);
        ingestCounts(safeRows);
        setLikedIds((prev) => {
          const next = new Set(prev);
          safeRows.forEach((r) => next.add(r.trips_id));
          return next;
        });
      })
      .catch(() => setLikedTrips([]));
    return () => { cancelled = true; };
  }, [tab, user?.user_id]);

  // debounced search
  useEffect(() => {
    const userId = user?.user_id ?? 0;
    const q = (query || "").trim();

    if (q.length < MIN_LEN) {
      setResults([]);
      return;
    }
    if (q === prevSearchRef.current) return;

    setIsSearching(true);

    const timer = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const rows = await api.searchTrips(q, userId, { signal: controller.signal });
        const safeRows = safe(rows);
        setResults(safeRows);
        ingestCounts(safeRows);

        if (safeRows.length) {
          setLikedIds((prev) => {
            const next = new Set(prev);
            safeRows.forEach((r) => r.is_liked && next.add(r.trips_id));
            return next;
          });
        }
        prevSearchRef.current = q;
      } catch (err) {
        if (err?.name !== "AbortError") toast.error("Search failed.");
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, [query, user?.user_id]);
  const isGuestUser = (userId) => {
    return userId && userId.toString().startsWith('guest_');
  };

  // like toggle
  const handleToggleLike = async (tripId, tripData) => {
    if (!user?.user_id) {
      toast.info("Log in to like trips.");
      return;
    }

    if (isGuestUser(user.user_id)) {
      toast.error("Guests cannot like trips. Please sign in.");
      return;
    }
    if (liking.has(tripId)) return;

    const willLike = !likedIds.has(tripId);
    setLiking((prev) => new Set(prev).add(tripId));
    setLikedIds((prev) => {
      const next = new Set(prev);
      willLike ? next.add(tripId) : next.delete(tripId);
      return next;
    });
    applyLikeToggle(tripId, willLike);
    if (!willLike) {
      setLikedTrips((prev) => prev.filter((t) => t.trips_id !== tripId));
    }

    try {
      const res = await api.toggleLike({ userId: user.user_id, tripId });
      const serverLiked = !!res?.liked;

      if (serverLiked !== willLike) {
        // revert
        setLikedIds((prev) => {
          const next = new Set(prev);
          serverLiked ? next.add(tripId) : next.delete(tripId);
          return next;
        });
        applyLikeToggle(tripId, !willLike);
        if (!serverLiked) {
          // unliked, ensure it's removed
          setLikedTrips((prev) => prev.filter((t) => t.trips_id !== tripId));
        } else if (serverLiked && !willLike && tripData) {
          setLikedTrips((prev) => {
            return prev.some((t) => t.trips_id === tripId) ? prev : [tripData, ...prev];
          });
        }
      }
    } catch {
      // revert on error
      setLikedIds((prev) => {
        const next = new Set(prev);
        willLike ? next.delete(tripId) : next.add(tripId);
        return next;
      });
      applyLikeToggle(tripId, !willLike);
      if (!willLike && tripData) {
        setLikedTrips((prev) => {
          return prev.some((t) => t.trips_id === tripId) ? prev : [tripData, ...prev];
        });
      }
      toast.error("Could not update like.");
    } finally {
      setLiking((prev) => {
        const n = new Set(prev);
        n.delete(tripId);
        return n;
      });
    }
  };

  function scrollByOneCard(ref, dir = 1) {
    if (isAddCooldown) return; // BLOCK SPAM CLICKS
    startCooldown();

    const vp = ref.current;
    if (!vp) return;

    const track = vp.querySelector(".carousel-track.infinite");
    const cards = track.children;
    const gap = parseInt(getComputedStyle(track).gap || "15", 10);
    const cardW = cards[0].clientWidth;
    const delta = dir * (cardW + gap);

    const realCount = cards.length - 4; // we added 2 clones on each side

    // scroll to target
    const next = vp.scrollLeft + delta;
    vp.scrollTo({ left: next, behavior: "smooth" });

    // after animation completes, check if we hit clones
    setTimeout(() => {
      const cardWidthTotal = cardW + gap;

      // If we went past the right clones → teleport back to real content
      if (next >= cardWidthTotal * (realCount + 2)) {
        vp.scrollTo({
          left: cardWidthTotal * 2, // start of real first card
          behavior: "instant"
        });
      }

      // If we went past the left clones → teleport to end of real content
      if (next <= 0) {
        vp.scrollTo({
          left: cardWidthTotal * realCount,
          behavior: "instant"
        });
      }
    }, 350); // slightly longer than smooth scroll duration
  }


  function startCooldown() {
    setIsAddCooldown(true);
    setTimeout(() => {
      setIsAddCooldown(false);
    }, 400);
  }
  

  // loading
  if (loadingUser) {
    return (
      <div className="trip-page">
        <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>
        <div className="content-with-sidebar">
          <NavBar />
          <div className="main-content">
            <div className="page-loading-container">
              <MoonLoader size={70} speedMultiplier={0.9} color="var(--accent)" data-testid="loader" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-page explore-page">
      <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>
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
          <div className="explore-search closer" ref={acWrapRef}>
            <div className="search-input-wrap">
              <Search size={18} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search by location"
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") prevSearchRef.current = "";
                }}
              />
              {isSearching && <span className="searching-dot" aria-label="searching" />}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="autocomplete">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setQuery(s);
                      setShowSuggestions(false);
                      prevSearchRef.current = "";
                    }}
                  >
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
                            {isSearching ? "Searching…" : `No public trips match “${query}”.`}
                          </div>
                        ) : (
                          results.map((t) => (
                            <TripCardPublic
                              key={`s-${t.trips_id}`}
                              trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
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
                <div className="section-title">Trending This Week</div>

                <div className="carousel">
                  {trending.length > 0 && (
                  <button
                    className="carousel-btn prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (carouselCooldown || trending.length === 0) return;

                      setCarouselCooldown(true);
                      scrollByOneCard(trRef, -1);

                      setTimeout(() => setCarouselCooldown(false), CAROUSEL_COOLDOWN_MS);
                    }}
                    disabled={trending.length === 0}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  )}
                  <div className="carousel-viewport" ref={trRef}>
                    <div className="carousel-track infinite">

                      {/* CLONE LAST 2 CARDS  */}
                      {trending.slice(-2).map((t, i) => (
                        <TripCardPublic
                          key={`tr-clone-left-${i}`}
                          trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                          liked={isLiked(t.trips_id)}
                          onToggleLike={handleToggleLike}
                          onOpen={handleOpenTrip}
                        />
                      ))}

                      {/*REAL CARDS */}
                    {trending.length === 0 ? (
                      <div className="empty-state" style={{ padding: "8px 12px", color: "#666" }}>
                        No trending trips yet. Check back soon!
                      </div>
                    ) : (
                      trending.map((t) => (
                        <TripCardPublic
                          key={`tr-${t.trips_id}`}
                          trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                          liked={isLiked(t.trips_id)}
                          onToggleLike={handleToggleLike}
                          onOpen={handleOpenTrip}
                        />
                      ))}

                      {/* CLONE FIRST 2 CARDS */}
                      {trending.slice(0, 2).map((t, i) => (
                        <TripCardPublic
                          key={`tr-clone-right-${i}`}
                          trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                          liked={isLiked(t.trips_id)}
                          onToggleLike={handleToggleLike}
                          onOpen={handleOpenTrip}
                        />
                      ))}
                    </div>
                  </div>
                {trending.length > 0 && (
                  <button
                    className="carousel-btn next"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (carouselCooldown || trending.length === 0) return;
                      
                      setCarouselCooldown(true);
                      scrollByOneCard(trRef, 1);

                      setTimeout(() => setCarouselCooldown(false), CAROUSEL_COOLDOWN_MS);
                    }}
                    disabled={trending.length === 0}
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
                </div>
              </section>


              {/* Top 10 all-time carousel */}
              <section className="trips-section">
                <div className="section-title">Top Trips of All-Time</div>

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
                    <div className="carousel-track infinite">

                      {/* Handle empty state */}
                      {topLiked.length === 0 ? (
                        <div
                          className="empty-state"
                          style={{ padding: "8px 12px", color: "#666" }}
                        >
                          No top trips yet.
                        </div>
                      ) : (
                        <>
                          {/* CLONE LAST 2 CARDS*/}
                          {topLiked.slice(-2).map((t, i) => (
                            <TripCardPublic
                              key={`tl-clone-left-${i}`}
                              trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                              liked={isLiked(t.trips_id)}
                              onToggleLike={handleToggleLike}
                              onOpen={handleOpenTrip}
                            />
                          ))}

                          {/* REAL CARDS  */}
                          {topLiked.map((t) => (
                            <TripCardPublic
                              key={`tl-${t.trips_id}`}
                              trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                              liked={isLiked(t.trips_id)}
                              onToggleLike={handleToggleLike}
                              onOpen={handleOpenTrip}
                            />
                          ))}

                          {/*  CLONE FIRST 2 CARDS (append) */}
                          {topLiked.slice(0, 2).map((t, i) => (
                            <TripCardPublic
                              key={`tl-clone-right-${i}`}
                              trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                              liked={isLiked(t.trips_id)}
                              onToggleLike={handleToggleLike}
                              onOpen={handleOpenTrip}
                            />
                          ))}
                        </>
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
              <div className="section-title">Your Liked Trips</div>
              <div className="liked-grid">
              {isGuestUser(user?.user_id) ? (
                <div className="empty-state" style={{ padding: "8px 12px", color: "#666" }}>
                You're browsing as a Guest. You must sign in to view liked trips.
              </div>
            ) :
                likedTrips.length === 0 ? (
                  <div className="empty-state" style={{ padding: "8px 12px", color: "#666" }}>
                    You haven’t liked any trips yet.
                  </div>
                ) : (
                  likedTrips.map((t) => (
                    <TripCardPublic
                      key={`lk-${t.trips_id}`}
                      trip={{ ...t, like_count: getLikeCount(t.trips_id, t.like_count) }}
                      liked={true}
                      onToggleLike={(id) => handleToggleLike(id, t)}
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