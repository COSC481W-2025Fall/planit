import React, { useState, useEffect } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import Popup from "../components/Popup";
import "../css/Popup.css";
import { createTrip, updateTrip, getTrips, deleteTrip } from "../../api/trips";
import { MapPin, Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MoonLoader } from "react-spinners";
import { toast } from "react-toastify";

export default function TripPage() {
  //constants for data
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);

  //constants for UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Get user details
  useEffect(() => {
    fetch(
        (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) +
        "/auth/login/details",
        { credentials: "include" }
    )
        .then((res) => res.json())
        .then((data) => {
          if (data.loggedIn === false) return;
          setUser({ ...data });
        })
        .catch((err) => console.error("User fetch error:", err));
  }, []);

  // Fetch trips once user is loaded
  useEffect(() => {
    if (!user?.user_id) return;

    getTrips(user.user_id)
        .then((data) => {
          const tripsArray = Array.isArray(data) ? data : data.trips;
          setTrips(tripsArray.sort((a, b) => a.trips_id - b.trips_id));
        })
        .catch((err) => console.error("Failed to fetch trips:", err));
  }, [user?.user_id]);

  //Show Loader while fetching user or trips
  if (!user || !trips) {
    return (
        <div className="trip-page">
          <TopBanner user={user} onSignOut={() => (window.location.href = "/")} />
          <div className="content-with-sidebar">
            <NavBar />
            <div className="main-content">
              <div className="page-loading-container">
                <MoonLoader color="var(--accent)" size={70} speedMultiplier={0.9} />
              </div>
            </div>
          </div>
        </div>
    );
  }


  // Delete trip
  const handleDeleteTrip = async (trips_id) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      try {
        await deleteTrip(trips_id);
        setTrips(trips.filter((trip) => trip.trips_id !== trips_id));
        toast.success("Trip deleted successfully!");
      } catch (err) {
        console.error("Delete trip failed:", err);
        toast.error("Failed to delete trip. Please try again.");
      }
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

      setEditingTrip(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save trip failed:", err);
      toast.error("Could not save trip. Please try again.");
    } finally {
      setTimeout(()=> setIsSaving(false), 1000);
    }
  };

  // Open modal for new trip
  const handleNewTrip = () => {
    setEditingTrip(null);
    setIsModalOpen(true);
  };

  // Open modal to edit trip
  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setIsModalOpen(true);
  };

  const handleTripRedirect = (tripId) => {
    navigate(`/days/${tripId}`);
  };

  return (
      <div className="trip-page">
        <TopBanner user={user} onSignOut={() => { console.log("Signed out"); window.location.href = "/"; }} />
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
                  <button className="filter-button">
                    <span className="filter-icon"></span> Filter
                  </button>
                </div>
              </div>

              {/* Trip cards */}
              <div className="trip-cards">
                {trips.length === 0 ? (
                    <div className="empty-state">
                      <h3>No trips yet!</h3>
                      <div>
                        {user
                            ? `${user.first_name}, you haven't created any trips! PlanIt now!`
                            : <MoonLoader color="var(--accent)" size={25} />} {/* ✅ replaces text */}
                      </div>
                    </div>
                ) : (
                    trips.map((trip) => (
                        <div key={trip.trips_id} className="trip-card">
                          <div className="trip-card-image" onClick={() => handleTripRedirect(trip.trips_id)}>
                          </div>

                          <button
                              className="trip-menu-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(
                                    openDropdownId === trip.trips_id
                                        ? null
                                        : trip.trips_id
                                );
                              }}
                          >
                            ⋮
                          </button>

                          {openDropdownId === trip.trips_id && (
                              <div className="trip-dropdown">
                                <button
                                    className="dropdown-item edit-item"
                                    onClick={() => {
                                      handleEditTrip(trip);
                                      setOpenDropdownId(null);
                                    }}
                                >
                                  <Pencil size={16} />Edit Trip
                                </button>
                                <button
                                    className="dropdown-item delete-item"
                                    onClick={() => {
                                      handleDeleteTrip(trip.trips_id);
                                      setOpenDropdownId(null);
                                    }}
                                >
                                  <Trash size={16} /> Delete Trip
                                </button>
                              </div>
                          )}

                          <div className="trip-card-content" onClick={() => handleTripRedirect(trip.trips_id)}>
                            <h3 className="trip-card-title">{trip.trip_name}</h3>
                            <div className="trip-location">
                              <MapPin size={16} style={{ marginRight: "4px" }} />
                              {trip.trip_location || "Location not set"}
                            </div>
                          </div>
                        </div>
                    ))
                )}
              </div>
            </div>

          {/* Modal for creating/editing trips */}
          {isModalOpen && (
            <Popup
              title=""
              buttons={
                <>
                  <button type="submit" form="trip-form" disabled={isSaving} className={isSaving ? "saving" : ""}>
                  {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={() => !isSaving && setIsModalOpen(false)} // prevent closing mid-save
>
                    Cancel
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
                      user_id: user.user_id,
                      isPrivate: true //PLACEHOLDER UNTIL FRONTEND IMPLEMENTS A WAY TO TRIGGER BETWEEN PUBLIC AND PRIVATE FOR TRIPS
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
                  <input
                    name="startDate"
                    type="date"
                    defaultValue={
                      editingTrip?.trip_start_date
                        ? new Date(editingTrip.trip_start_date).toISOString().split("T")[0]
                        : ""
                    }
                    required
                  />
                </form>
              </div>
            </Popup>
          )}
        </div>
      </div>
    </div>
  );
}
