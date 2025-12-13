import React, {useState, useEffect, useRef, useMemo} from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import Popup from "../components/Popup";
import "../css/Popup.css";
import {createTrip, updateTrip, getTrips, deleteTrip} from "../../api/trips";
import {MapPin, Pencil, Trash,  Lock, Unlock, UserPlus, X, Eye, ChevronLeft, ChevronRight, Calendar} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {MoonLoader} from "react-spinners";
import {toast} from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ImageSelector from "../components/ImageSelector";
import GuestEmptyState from "../components/GuestEmptyState";
import TripsFilterButton from "../components/TripsFilterButton";
import Label from "../components/Label.jsx";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(
      editingTrip?.trip_start_date ? new Date(editingTrip.trip_start_date) : null
    );
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageUrls, setImageUrls] = useState({});
    const [endDate, setEndDate] = useState(null);
    const [deleteTripId, setDeleteTripId] = useState(null);
    const [privacyDraft, setPrivacyDraft] = useState(true);
    const [tripNotesDraft, setTripNotesDraft] = useState("");
    const [wasSubmitted, setWasSubmitted] = useState(false);




  const isMobile = () => window.innerWidth <= 600;

  const [showAILabelsGlobal, setShowAILabelsGlobal] = useState(() => {
        return localStorage.getItem("planit:showAILabels") !== "false";
    });

  const MobileDateInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
    <div
      className={`mobile-date-input ${!value ? 'placeholder' : ''}`}
      onClick={onClick}
      ref={ref}
    >
      {value || placeholder}
    </div>
  ));

    // persist sort / filter choices
    const [sortOption, setSortOption] = useState(() => {
      if (typeof window === "undefined") return "recent";
      return localStorage.getItem("tripSortOption") || "recent"; // default: Most recently edited
    });
    const [dateFilter, setDateFilter] = useState(() => {
      if (typeof window === "undefined") return "all";
      return localStorage.getItem("tripDateFilter") || "all"; // default: All trips
    });
    const [hiddenLabels, setHiddenLabels] = useState(() => {
      const stored = localStorage.getItem("hiddenTripLabels");
      return stored ? JSON.parse(stored) : [];
    });
    const [categoryFilter, setCategoryFilter] = useState("all");

  const toggleLabelVisibility = (tripId) => {

  setHiddenLabels((prev) => {
    let updated;

    if (prev.includes(tripId)) {
      updated = prev.filter(id => id !== tripId);   // unhide
    } else {
      updated = [...prev, tripId];                  // hide
    }

    localStorage.setItem("hiddenTripLabels", JSON.stringify(updated));
    return updated;
  });
};
// Sync "Show AI Labels" with SettingsPage changes
    useEffect(() => {
        const handler = () => {
            const val = localStorage.getItem("planit:showAILabels") !== "false";
            setShowAILabelsGlobal(val);
        };
        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    // Close dropdown if click outside
    useEffect(() => {
      const handleClickOutside = (e) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
              setOpenDropdownId(null);
          }
      };
      document.addEventListener("mousedown",
      handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [])

    // Get user details
    useEffect(() => {
      fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        "/auth/login/details",
        {credentials: "include"}
      )
        .then((res) => res.json())
        .then((data) => {
            if (data.loggedIn === false) return;
            setUser({...data});
        })
        .catch((err) => console.error("User fetch error:", err));
  }, []);

    // Fetch trips once user is loaded
    useEffect(() => {
      if (!user?.user_id || isGuestUser(user.user_id)) return;

        getTrips(user.user_id)
          .then((data) => {
              const tripsArray = Array.isArray(data) ? data : data.trips;
              setTrips(tripsArray.sort((a, b) => a.trips_id - b.trips_id));
          })
          .catch((err) => {
            console.error("Failed to fetch trips:", err);
            setTrips([]);
          });
    }, [user?.user_id]);

  useEffect(() => {
    const message = localStorage.getItem("removedToast");
    if (message) {
      toast.success(message);
      localStorage.removeItem("removedToast");
    }
  }, []);

    useEffect(() => {
    if (editingTrip) {
        setStartDate(new Date(editingTrip.trip_start_date));
        if (editingTrip.trip_end_date) {
            setEndDate(new Date(editingTrip.trip_end_date));
        }
        setPrivacyDraft(editingTrip.is_private ?? true);

        // preload existing trip notes
        setTripNotesDraft(editingTrip.notes || "");
    } else {
        setStartDate(null);
        setEndDate(null);
        setPrivacyDraft(true);

        // clear notes for "New Trip"
        setTripNotesDraft("");
    }
}, [editingTrip]);

    // Fetch image URLs for trips when component loads or trips change
    useEffect(() => {
      if (!trips || trips.length === 0) return;

      const fetchImages = async () => {
        const newImageUrls = {};

        for (const trip of trips) {
          if (!trip.image_id || trip.image_id === 0) continue;

          // Check if the image URL is already in localStorage global cache
          const imageCacheKey = `image_${trip.image_id}_v1`;
          const cachedImageUrl = localStorage.getItem(imageCacheKey);

          // If the image is cached, use it
          if (cachedImageUrl) {
            newImageUrls[trip.trips_id] = cachedImageUrl;
            continue;
          }

          try {
            const res = await fetch(
              `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/image/readone?imageId=${trip.image_id}`,
              { credentials: "include" }
            );

            const data = await res.json();
            localStorage.setItem(imageCacheKey, data);
            newImageUrls[trip.trips_id] = data;
          } catch (err) {
            console.error(`Error fetching image for trip ${trip.trips_id}:`, err);
          }
        }
        // Merge new image URLs with existing ones
        setImageUrls((prev) => ({...prev, ...newImageUrls}));
      };

      fetchImages();
    }, [trips]);

    // persist choices to localStorage whenever they change
    useEffect(() => {
      if (typeof window === "undefined") return;
      if (sortOption) {
        localStorage.setItem("tripSortOption", sortOption);
      } else {
        localStorage.removeItem("tripSortOption");
      }
    }, [sortOption]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (dateFilter) {
        localStorage.setItem("tripDateFilter", dateFilter);
      } else {
        localStorage.removeItem("tripDateFilter");
      }
    }, [dateFilter]);

  useEffect(() => {
    if (isModalOpen || deleteTripId) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isModalOpen, deleteTripId]);

    // fully reset and close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTrip(null);          // ensure next open re-initializes
        setStartDate(null);
        setEndDate(null);
        setPrivacyDraft(true);         // clear any unsaved toggle
        setSelectedImage(null);
    };

    const sortedFilteredTrips = useMemo(() => {
        if (!Array.isArray(trips)) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let result = [...trips];

        //filter by category
        if (categoryFilter !== "all") {
            result = result.filter((trip) => (trip.trip_category || "").toLowerCase() === categoryFilter.toLowerCase());
        }

        // filter: All / Upcoming / Past
        result = result.filter((trip) => {
            const start = trip.trip_start_date ? new Date(trip.trip_start_date) : null;
            const end = trip.trip_end_date ? new Date(trip.trip_end_date) : null;

            // "Past" = trip fully finished before today.
            // Anything else (ongoing today or in the future) counts as "upcoming".
            const isPast =
              (end && end < today) ||
              (!end && start && start < today);

            if (dateFilter === "upcoming") {
                return !isPast;
            }

            if (dateFilter === "past") {
                return isPast;
            }

            return true; // "all"
        });

        // sort
        result.sort((a, b) => {
            // sort by name
            if (sortOption === "az" || sortOption === "za") {
                const nameA = (a.trip_name || "").toLowerCase();
                const nameB = (b.trip_name || "").toLowerCase();
                const cmp = nameA.localeCompare(nameB);
                return sortOption === "az" ? cmp : -cmp;
            }

            // sort by location
            if (sortOption === "location") {
                const locA = (a.trip_location || "").toLowerCase();
                const locB = (b.trip_location || "").toLowerCase();
                return locA.localeCompare(locB);
            }

            // date-based sorts
            const getDateForSort = (trip) => {
                // "recent" prefers updated_at if present
                if (sortOption === "recent" && (trip.trip_updated_at)) {
                    return new Date(trip.trip_updated_at);
                }
                if (trip.trip_start_date) return new Date(trip.trip_start_date);
                if (trip.trip_end_date) return new Date(trip.trip_end_date);
                if (trip.trip_updated_at) {
                    return new Date(trip.trip_updated_at);
                }
                return null;
            };

            const dateA = getDateForSort(a);
            const dateB = getDateForSort(b);

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            if (sortOption === "earliest") {
                // oldest start/end date first
                return dateA - dateB;
            }

            if (sortOption === "oldest") {
                // newest start/end date first
                return dateB - dateA;
            }

            if (sortOption === "recent") {
                // most recently edited first
                return dateB - dateA;
            }

            // fallback: ascending date
            return dateA - dateB;
        });

        return result;
    }, [trips, sortOption, dateFilter, categoryFilter]);

  const isGuestUser = (userId) => {
    return userId && userId.toString().startsWith('guest_');
  };


    //Show Loader while fetching user or trips
    if (!user) {
      return (
        <div className="trip-page">
            <TopBanner user={user} isGuest = {isGuestUser(user?.user_id)}/>
            <div className="content-with-sidebar">
                <NavBar/>
                <div className="main-content">
                    <div className="page-loading-container">
                        <MoonLoader color="var(--accent)" size={70} speedMultiplier={0.9} data-testid="loader"/>
                    </div>
                </div>
            </div>
      </div>
        );
    }

  // guest empty state if user is a guest
  if (isGuestUser(user.user_id)) {
    return (
      <div className="trip-page no-scroll">
        <TopBanner user={user} isGuest = {isGuestUser(user?.user_id)}/>
        <div className="content-with-sidebar">
          <NavBar />
          <div className="main-content">
            <GuestEmptyState title = "Hi, Guest" description = "You're currently browsing as a Guest. Sign in to create and save your own trips." />
          </div>
        </div>
      </div>
    );
  }

  if (trips === null) {
  return (
    <div className="trip-page">
      <TopBanner user={user} isGuest={false}/>
      <div className="content-with-sidebar">
        <NavBar/>
        <div className="main-content">
          <div className="page-loading-container">
            <MoonLoader color="var(--accent)" size={70} speedMultiplier={0.9} data-testid="loader"/>
          </div>
        </div>
      </div>
    </div>
  );
}
    // Delete trip
    const handleDeleteTrip = async (trips_id) => {
        try {
            await deleteTrip(trips_id);
            setTrips(trips.filter((trip) => trip.trips_id !== trips_id));
            toast.success("Trip deleted successfully!");
        } catch (err) {
            console.error("Delete trip failed:", err);
            toast.error("Failed to delete trip. Please try again.");
        }
    };

  // Save trip (create/update)
  const handleSaveTrip = async (tripData) => {
    setWasSubmitted(true);

    if (isSaving) return;
    setIsSaving(true);

    const start = new Date(tripData.trip_start_date);
    const end = new Date(tripData.trip_end_date);

    const diffMs = end - start;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

  

    if (diffDays > 90) {
      toast.error("Trips cannot be longer than 90 days.");
      setIsSaving(false);
      return;
    }

    try {
      if (editingTrip) {
        await updateTrip({ ...tripData, trips_id: editingTrip.trips_id, username: user.username });
        toast.success("Trip updated successfully!");
      } else {
        await createTrip(tripData);
        toast.success("Trip created successfully!");
      }

            if (user && user.user_id) {
                const updatedTrips = await getTrips(user.user_id);
                let tripsArray = updatedTrips.trips || [];
                setTrips(tripsArray.sort((a, b) => a.trips_id - b.trips_id));
            }
            handleCloseModal();
        } catch (err) {
            console.error("Save trip failed:", err);
            const msg = err.response?.data?.error;
              if (msg === "Profanity detected.") {
                toast.error("Profanity detected.");
                return;
              }
            toast.error("Could not save trip. Please try again.");
        } finally {
          setTimeout(() => setIsSaving(false), 1000);
        }
    };

    const handleNewTrip = () => {
        setWasSubmitted(false);
        setEditingTrip(null);
        setStartDate(null);
        setEndDate(null);
        setPrivacyDraft(true);  
        setTripNotesDraft("");
        setIsModalOpen(true);
    };

    const handleEditTrip = async (trip) => {
        setWasSubmitted(false);
        setEditingTrip(trip);
        setPrivacyDraft(trip.is_private ?? true);
        setIsModalOpen(true);

        if (trip.image_id && trip.image_id !== 0) {
          const imageCacheKey = `image_${trip.image_id}_v1`;
          const cachedImageUrl = localStorage.getItem(imageCacheKey);

          if (cachedImageUrl) {
            setSelectedImage(cachedImageUrl);
            return;
          }

          try {
            const res = await fetch(
              `${import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL}/image/readone?imageId=${trip.image_id}`,
              { credentials: "include" }
            );
            const data = await res.json();
            localStorage.setItem(imageCacheKey, data);
            setSelectedImage(data);
          } catch (err) {
            console.error("Error fetching trip image:", err);
            setSelectedImage(null);
          }
        } else {
          setSelectedImage(null);
        }
    };

  const handleTripRedirect = (tripId) => {
    navigate(`/days/${tripId}`);
  };

    const handleTogglePrivacy = async (trip) => {
        const nextPrivate = !trip.is_private;
        try {
            await updateTrip({ trips_id: trip.trips_id, isPrivate: nextPrivate , username: user.username});
            setTrips((prev) =>
              prev.map((t) => (t.trips_id === trip.trips_id ? { ...t, is_private: nextPrivate } : t))
            );
            toast.success(nextPrivate ? "Trip set to private." : "Trip set to public.");
        } catch (err) {
            console.error("Privacy toggle failed:", err);
            toast.error("Failed to update privacy.");
        }
    };
  return (
    <div className="trip-page">
      <TopBanner user={user} isGuest={isGuestUser(user?.user_id)}/>
      <div className="content-with-sidebar">
        <NavBar userId={user.user_id} isGuest={isGuestUser(user?.user_id)}/>
        <div className="main-content">
          <div className="trips-section">
            {/* Header row */}
            <div className="trips-header">
              <div className="trips-title-section">
                <div className="trips-title">
                  {user
                    ? `${user.username ? user.username : user.first_name}'s Trips`
                    : <MoonLoader color="var(--accent)" size={30} />}
                </div>
                <div className="trips-subtitle">
                  Plan and manage your upcoming trips
                </div>
              </div>

              <div className="banner-controls">
                <button className="new-trip-button" onClick={handleNewTrip}>
                  + New Trip
                </button>
                <TripsFilterButton
                  sortOption={sortOption}
                  setSortOption={setSortOption}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />
              </div>
            </div>

                      {/* Trip cards */}
                      <div className="trip-cards">
                          {sortedFilteredTrips.length === 0 ? (
                            <div className="empty-state">
                              {trips.length == 0  ?  (
                                <>
                                <h3>No trips yet!</h3>
                                <div>
                                    {user
                                      ? `${user.first_name}, you haven't created any trips! PlanIt now!`
                                      : <MoonLoader color="var(--accent)" size={25}/>}
                                </div>
                                </>
                              ) : (
                                <>
                                <h3>No trips match your filters</h3>
                                <div>Try adjusting your filters to see more trips</div>
                                </>
                              )}
                            </div>
                          ) : (
                            sortedFilteredTrips.map((trip) => (
                              <div key={trip.trips_id} className="trip-card">
                                  <div className="trip-card-image"
                                    onClick={() => handleTripRedirect(trip.trips_id)}>
                                    <img
                                    src={imageUrls[trip.trips_id]}
                                    alt={trip.trip_name}
                                    className="trip-card-img"
                                    draggable={false}
                                    loading="lazy"
                                    />
                                  </div>
                                  <button
                                    className="privacy-toggle-btn"
                                    title={trip.is_private ? "Unprivate" : "Private"}
                                    disabled={isModalOpen}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isModalOpen) return;
                                      handleTogglePrivacy(trip);
                                    }}
                                  >
                                    {trip.is_private ? <Lock size={16}/> : <Unlock size={16}/>}
                                  </button>

                                  <button
                                    className="trip-menu-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(
                                          openDropdownId === trip.trips_id ? null : trip.trips_id
                                        );
                                    }}
                                  >
                                      ⋮
                                  </button>

                                {openDropdownId === trip.trips_id && (
                                  <div className="trip-dropdown" ref={dropdownRef}>

                                    <button
                                      className="dropdown-item edit-item"
                                      onClick={() => {
                                        handleEditTrip(trip);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      <Pencil size={16} /> Edit Trip
                                    </button>

                                    <button
                                      className="dropdown-item delete-item"
                                      onClick={() => {
                                        setDeleteTripId(trip.trips_id);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      <Trash size={16} /> Delete Trip
                                    </button>

                                    {trip.trip_category && (
                                      hiddenLabels.includes(trip.trips_id) ? (
                                        <button
                                          className="dropdown-item"
                                          onClick={() => {
                                            toggleLabelVisibility(trip.trips_id);
                                            setOpenDropdownId(null);
                                          }}
                                        >
                                          <Eye size={16} /> Show Label
                                        </button>
                                      ) : (
                                        <button
                                          className="dropdown-item"
                                          onClick={() => {
                                            toggleLabelVisibility(trip.trips_id);
                                            setOpenDropdownId(null);
                                          }}
                                        >
                                          <X size={16} /> Hide Label
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}

                                  <div
                                    className="trip-card-content"
                                    onClick={() => handleTripRedirect(trip.trips_id)}
                                  >
                                      <div className="trip-card-title-row">
                                      <h3 className="trip-card-title">{trip.trip_name}</h3>

                                          {showAILabelsGlobal &&
                                              trip.trip_category &&
                                              !hiddenLabels.includes(trip.trips_id) && (
                                                  <Label category={trip.trip_category} className="trip-card-badge" />
                                              )}
                                      </div>
                                      <div className="trip-card-footer">
                                          <div className="trip-location">
                                              <MapPin size={16} style={{marginRight: "4px"}}/>
                                              {trip.trip_location || "Location not set"}
                                          </div>
                                          <p className="trip-date">
                                              {trip.trip_start_date && (
                                                  <span className="trip-date">
                                              <Calendar size={16} />
                                                      {new Date(trip.trip_start_date).toLocaleDateString()}
                                          </span>
                                              )}
                                          </p>
                                      </div>
                                  </div>
                              </div>
                            ))
                          )}
                      </div>
                  </div>

                    {deleteTripId && (
                        <Popup
                            title="Delete Trip"
                            onClose={() => setDeleteTripId(null)}
                            buttons={
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTripId(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                      className="btn-rightside"
                                        type="button"
                                        onClick={() => {
                                            handleDeleteTrip(deleteTripId);
                                            setDeleteTripId(null);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </>
                            }
                        >
                            <p className="popup-body-text">
                                Are you sure you want to delete this trip? This action cannot be undone.
                            </p>
                        </Popup>
                    )}

                  {/* Modal for creating/editing trips */}
                  {isModalOpen && (
                    <Popup
                      title=""
                      onClose={handleCloseModal}
                      buttons={
                        <>
                          <button  type="button" onClick={() => !isSaving && setIsModalOpen(false)}>
                            Cancel
                          </button>
                          <button
                            type="submit"
                            form="trip-form"
                            disabled={isSaving}
                            className={`trip-submit-btn btn-rightside ${isSaving ? "saving" : ""}`}
                            onClick={() => setWasSubmitted(true)}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                          </>
                      }
                    >
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>{editingTrip ? "Edit Trip" : "Create New Trip"}</h2>
                            <form
                              id="trip-form"
                              className={wasSubmitted ? "was-submitted" : ""}
                              onSubmit={async (e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.target);
                                  
                                  const tripName = formData.get("name")?.trim() || "";
                                  const words = tripName.split(/\s+/).filter(Boolean);
                                  const tooLongWord = words.find(word => word.length > 14);

                                  if (tooLongWord) {
                                    toast.error("Each word in the trip name must be 14 characters or fewer.");
                                    return;
                                  }

                                  const tripData = {
                                      trip_name: formData.get("name"),
                                      trip_location: formData.get("location"),
                                      trip_start_date: formData.get("startDate"),
                                      image_id: selectedImage ? selectedImage.image_id : (editingTrip?.image_id ?? 1),
                                      trip_end_date: formData.get("endDate"),
                                      user_id: user.user_id,
                                      isPrivate: privacyDraft,
                                      notes: tripNotesDraft
                                  };
                                  if (editingTrip) tripData.trips_id = editingTrip.trips_id;
                                // Auto-capitalize locations
                                tripData.trip_location = tripData.trip_location
                                  .trim()
                                  .toLowerCase()
                                  .replace(/\b\w/g, c => c.toUpperCase());                             
                                  await handleSaveTrip(tripData);
                              }}
                            >
                                <input
                                  name="name"
                                  placeholder="Trip Name"
                                  maxLength="44"
                                  defaultValue={editingTrip?.trip_name || ""}
                                  required
                                />
                                <input
                                  name="location"
                                  placeholder="Location"
                                  maxLength="36"
                                  defaultValue={editingTrip?.trip_location || ""}
                                  required
                                />
                                {/* React-controlled DatePicker */}
                                <DatePicker
                                  selected={startDate}
                                  onChange={(date) => setStartDate(date)}
                                  placeholderText="Start Date"
                                  popperPlacement="bottom"
                                  className="date-input"
                                  dateFormat="MM-dd-yyyy"
                                  shouldCloseOnSelect={true}
                                  withPortal={isMobile()}
                                  portalId="root-portal"
                                  customInput={isMobile() ? <MobileDateInput placeholder="Start Date" /> : undefined}
                                  onClickOutside={() =>
                                    setTimeout(() => {
                                      document.activeElement?.blur();
                                    }, 120)
                                  }
                                  required
                                  renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
                                    <div className="calendar-header">
                                      <div className="month-nav">
                                        <button type="button" className="month-btn" onClick={decreaseMonth}>
                                          <ChevronLeft size={20} />
                                        </button>
                                        <span className="month-label">
                                          {date.toLocaleString("default", { month: "long" })} {date.getFullYear()}
                                        </span>
                                        <button type="button" className="month-btn" onClick={increaseMonth}>
                                          <ChevronRight size={20} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                />

                                {!editingTrip &&
                                 <DatePicker
                                  selected={endDate}
                                  onChange={(date) => setEndDate(date)}
                                  placeholderText="End Date"
                                  popperPlacement="bottom"
                                  className="date-input"
                                  dateFormat="MM-dd-yyyy"
                                  minDate={startDate}
                                  maxDate={
                                    startDate
                                      ? new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000)
                                      : null
                                  }
                                  shouldCloseOnSelect={true}
                                  withPortal={isMobile()}
                                  portalId="root-portal"
                                  customInput={isMobile() ? <MobileDateInput placeholder="End Date" /> : undefined}
                                  onClickOutside={() =>
                                    setTimeout(() => {
                                      document.activeElement?.blur();
                                    }, 120)
                                  }
                                  required
                                  renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
                                    <div className="calendar-header">
                                      <div className="month-nav">
                                        <button type="button" className="month-btn" onClick={decreaseMonth}>
                                          <ChevronLeft size={20} />
                                        </button>
                                        <span className="month-label">
                                          {date.toLocaleString("default", { month: "long" })} {date.getFullYear()}
                                        </span>
                                        <button type="button" className="month-btn" onClick={increaseMonth}>
                                          <ChevronRight size={20} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                 />
                                }

                                {/* Hidden input so backend still receives startDate and endDate as text */}
                                <input
                                  type="hidden"
                                  name="startDate"
                                  value={startDate ? startDate.toISOString().split("T")[0] : ""}
                                />
                                <div className="image-selector-privacy-container">
                                  <ImageSelector onSelect={(img) => setSelectedImage(img)} />
                                  <input
                                    type="hidden"
                                    name="endDate"
                                    value={endDate ? endDate.toISOString().split("T")[0] : ""}
                                  />

                                  <div className="privacy-switch-container">
                                    <div
                                      className={`privacy-switch ${privacyDraft ? "private" : "public"}`}
                                      onClick={() => setPrivacyDraft(!privacyDraft)}
                                    >
                                      <div
                                        className={`privacy-icon left ${privacyDraft ? "active" : ""}`}
                                        data-label="Private"
                                      >
                                        <Lock size={14} />
                                      </div>

                                      <div
                                        className={`privacy-icon right ${!privacyDraft ? "active" : ""}`}
                                        data-label="Public"
                                      >
                                        <Unlock size={14} />
                                      </div>

                                      <div className="privacy-switch-knob"></div>
                                    </div>
                                  </div>
                                </div>
                                <label className="popup-input">
                                  <span>Notes</span>

                                  <textarea
                                    name="tripNotes"
                                    className="textarea-notes"
                                    placeholder="Enter any notes you have about this trip!"
                                    value={tripNotesDraft}
                                    onChange={(e) => setTripNotesDraft(e.target.value)}
                                    maxLength={200}
                                  />

                                  <div className="char-count">
                                    {tripNotesDraft.length} / 200
                                  </div>
                                </label>
                              </form>
                            </div>
                    </Popup>
                  )}
              </div>
          </div>
      </div>
    );
}
