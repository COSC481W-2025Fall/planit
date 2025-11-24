import React, {useState, useEffect, useRef, useMemo} from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";
import Popup from "../components/Popup";
import "../css/Popup.css";
import {createTrip, updateTrip, getTrips, deleteTrip} from "../../api/trips";
import {MapPin, Pencil, Trash,  Lock, Unlock, UserPlus, X} from "lucide-react";
import {useNavigate} from "react-router-dom";
import {MoonLoader} from "react-spinners";
import {toast} from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ImageSelector from "../components/ImageSelector";
import GuestEmptyState from "../components/GuestEmptyState";
import TripsFilterButton from "../components/TripsFilterButton";

export default function TripPage() {
    const [user, setUser] = useState(null);
    const [trips, setTrips] = useState([]);
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

    // persist sort / filter choices
    const [sortOption, setSortOption] = useState(() => {
      if (typeof window === "undefined") return "recent";
      return localStorage.getItem("tripSortOption") || "recent"; // default: Most recently edited
    });
    const [dateFilter, setDateFilter] = useState(() => {
      if (typeof window === "undefined") return "all";
      return localStorage.getItem("tripDateFilter") || "all"; // default: All trips
    });

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
          .catch((err) => console.error("Failed to fetch trips:", err));
    }, [user?.user_id]);

    useEffect(() => {
        if (editingTrip) {
            setStartDate(new Date(editingTrip.trip_start_date));
            if (editingTrip.trip_end_date) {
                setEndDate(new Date(editingTrip.trip_end_date));
            }
            setPrivacyDraft(editingTrip.is_private ?? true);
        } else {
            setStartDate(null);
            setEndDate(null);
            setPrivacyDraft(true);
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
          const cachedImageUrl = localStorage.getItem(`image_${trip.image_id}`);

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
            localStorage.setItem(`image_${trip.image_id}`, data);
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
                if (sortOption === "recent" && (trip.updated_at || trip.updatedAt)) {
                    return new Date(trip.updated_at || trip.updatedAt);
                }
                if (trip.trip_start_date) return new Date(trip.trip_start_date);
                if (trip.trip_end_date) return new Date(trip.trip_end_date);
                if (trip.updated_at || trip.updatedAt) {
                    return new Date(trip.updated_at || trip.updatedAt);
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
    }, [trips, sortOption, dateFilter]);

  const isGuestUser = (userId) => {
    return userId && userId.toString().startsWith('guest_');
  };


    //Show Loader while fetching user or trips
    if (!user || !trips) {
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
      <div className="trip-page">
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
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (editingTrip) {
        await updateTrip({ ...tripData, trips_id: editingTrip.trips_id });
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
            toast.error("Could not save trip. Please try again.");
        } finally {
          setTimeout(() => setIsSaving(false), 1000);
        }
    };

    const handleNewTrip = () => {
        setEditingTrip(null);
        setStartDate(null);
        setEndDate(null);
        setPrivacyDraft(true);                
        setIsModalOpen(true);
    };

    const handleEditTrip = async (trip) => {
        setEditingTrip(trip);
        setPrivacyDraft(trip.is_private ?? true); 
        setIsModalOpen(true);

        if (trip.image_id && trip.image_id !== 0) {
          const cachedImageUrl = localStorage.getItem(`image_${trip.image_id}`);

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
            localStorage.setItem(`image_${trip.image_id}`, data);
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
            await updateTrip({ trips_id: trip.trips_id, isPrivate: nextPrivate });
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
        <NavBar />
        <div className="main-content">
          <div className="trips-section">
            {/* Header row */}
            <div className="trips-header">
              <div className="trips-title-section">
                <div className="trips-title">
                  {user
                    ? `${user.first_name} ${user.last_name}'s Trips`
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
                />
              </div>
            </div>

                      {/* Trip cards */}
                      <div className="trip-cards">
                          {sortedFilteredTrips.length === 0 ? (
                            <div className="empty-state">
                                <h3>No trips yet!</h3>
                                <div>
                                    {user
                                      ? `${user.first_name}, you haven't created any trips! PlanIt now!`
                                      : <MoonLoader color="var(--accent)" size={25}/>}
                                </div>
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
                                            <Pencil size={16}/> Edit Trip
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
                                    </div>
                                  )}

                                  <div
                                    className="trip-card-content"
                                    onClick={() => handleTripRedirect(trip.trips_id)}
                                  >
                                      <h3 className="trip-card-title">{trip.trip_name}</h3>
                                      <div className="trip-location">
                                          <MapPin size={16} style={{marginRight: "4px"}}/>
                                          {trip.trip_location || "Location not set"}
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
                              onSubmit={async (e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.target);
                                  const tripData = {
                                      trip_name: formData.get("name"),
                                      trip_location: formData.get("location"),
                                      trip_start_date: formData.get("startDate"),
                                      image_id: selectedImage ? selectedImage.image_id : (editingTrip?.image_id ?? 1),                                      
                                      trip_end_date: formData.get("endDate"),
                                      user_id: user.user_id,
                                      isPrivate: privacyDraft //PLACEHOLDER UNTIL FRONTEND IMPLEMENTS A WAY TO TRIGGER BETWEEN PUBLIC AND PRIVATE FOR TRIPS
                                  };
                                  if (editingTrip) tripData.trips_id = editingTrip.trips_id;
                                  console.log(tripData)
                                  await handleSaveTrip(tripData);
                              }}
                            >
                                <input
                                  name="name"
                                  placeholder="Trip Name"
                                  maxLength="30"
                                  defaultValue={editingTrip?.trip_name || ""}
                                  required
                                />
                                <input
                                  name="location"
                                  placeholder="Location"
                                  maxLength="30"
                                  defaultValue={editingTrip?.trip_location || ""}
                                  required
                                />
                                {/* React-controlled DatePicker */}
                                <DatePicker
                                  selected={startDate}
                                  onChange={(date) => setStartDate(date)}
                                  placeholderText="Start Date"
                                  withPortal={window.innerWidth <= 768}
                                  popperPlacement="bottom"
                                  className="date-input"
                                  dateFormat="MM-dd-yyyy"
                                  required
                                />
                                {!editingTrip &&
                                 <DatePicker
                                  selected={endDate}
                                  onChange={(date) => setEndDate(date)}
                                  placeholderText="End Date"
                                  withPortal={window.innerWidth <= 768}
                                  popperPlacement="bottom"
                                  className="date-input"
                                  dateFormat="MM-dd-yyyy"
                                  minDate={startDate}
                                  required
                                 />
                                }

                                {/* Hidden input so backend still receives startDate and endDate as text */}
                                <input
                                  type="hidden"
                                  name="startDate"
                                  value={startDate ? startDate.toISOString().split("T")[0] : ""}          
                                />
                                <ImageSelector onSelect={(img) => setSelectedImage(img)} />
                                 <input
                                  type="hidden"
                                  name="endDate"
                                  value={endDate ? endDate.toISOString().split("T")[0] : ""}
                                />
                                <div className="privacy-row">
                                  <button
                                    type="button"
                                    onClick={() => setPrivacyDraft(true)}
                                    title="Private"
                                    className={`privacy-chip ${privacyDraft ? "active" : ""}`}
                                  >
                                    <Lock size={16}/>
                                    <span>Private</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPrivacyDraft(false)}
                                    title="Public"
                                    className={`privacy-chip ${!privacyDraft ? "active" : ""}`}
                                  >
                                    <Unlock size={16}/>
                                    <span>Public</span>
                                  </button>
                                </div>
                            </form>
                        </div>
                    </Popup>
                  )}
              </div>
          </div>
      </div>
    );
}
