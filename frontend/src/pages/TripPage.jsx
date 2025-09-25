import React, { useState, useEffect } from "react";
import "../css/TripPage.css";
import TopBanner from "../components/TopBanner";
import NavBar from "../components/NavBar";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import Popup from "../components/Popup";
import "../css/Popup.css";
import { createTrip, updateTrip } from "../../api/trips";

export default function TripPage() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // run this code when the component first loads
  useEffect(() => {
    fetch(
      (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/login/details",
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn === false) return;
        setUser(data);
      });
  }, []);
  //Open modal to create new trip
  const handleNewTrip = () => {
    //Reset editing and open modal for new trip
    setEditingTrip(null);
    setIsModalOpen(true);
  }
  //Open modal to edit exisiting trip
  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setIsModalOpen(true);
  }
  //Handle deleting trip
  const handleDeleteTrip = (tripID) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      setTrips(trips.filter(trip => trip.id !== tripID));
    }
  }
  //Save trip
  const handleSaveTrip = async (tripData) => {
    console.log("Saving Trip")
    try {
      if (editingTrip) {
        // update existing trip
        const updated = await updateTrip({ ...tripData, id: editingTrip.id });
        setTrips(trips.map(trip =>
          trip.id === editingTrip.id ? normalizeTrip(updated) : trip
        ));
      } else {
        // create new trip
        const created = await createTrip(tripData);
        setTrips([...trips, normalizeTrip(created)]);
      }
  
      // close modal
      setEditingTrip(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save trip failed:", err);
      alert("Could not save trip. Please try again.");
    }
  };
  function normalizeTrip(t) {
    return {
      id: t.id,
      name: t.tripName || t.name || "Untitled Trip",
      locations: Array.isArray(t.tripLocation)
        ? t.tripLocation
        : t.tripLocation
        ? [t.tripLocation]
        : [],
      image: t.image || "",
      startDate: t.tripStartDate || t.startDate || "",
      endDate: t.tripEndDate || t.endDate || "",
      days: t.days ?? 0,
      lastUpdated: t.updatedAt || "",
    };
  }
  
  // the empty array means this effect only runs once when the component loads
  
  useEffect(() => {
    const baseUrl = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;
  
    fetch(`${baseUrl}/auth/user/trips`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn === false) return;
        setTrips(data.trips || []);
      })
      .catch((err) => console.log("Failed to fetch trips:", err));
  }, []);
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="trip-page">
      <TopBanner></TopBanner>
      <div className="content-with-sidebar">
        <NavBar></NavBar>
        <div className="main-content">
          <div className="trips_section">
            {/* Header row */}
            <div className="trips_header">
              <div className="trips_title_section">
                <div className="trips_title">
                  {user.first_name} {user.last_name}'s Trips
                </div>
                <div className="trips_subtitle">
                  Plan and manage your upcoming trips
                </div>
              </div>

              <div className="banner_controls">
                <button className="new_trip_button" onClick={handleNewTrip}>
                  + New Trip
                </button>
                <button className="filter_button">
                  <span className="filter_icon">⚙</span> Filter
                </button>
              </div>
            </div> 

            {/* Trip cards grid */}
            <div className="trip_cards">
              {trips.length === 0 ? (
                <div className="empty_state">
                  <h3>No trips yet!</h3>
                  <div>
                    {user.first_name}, you haven't created any trips! PlanIt now!
                  </div>
                </div>
              ) : (
                trips.map((trip) => (
                  <div key={trip.id} className="trip_card">
                    <div className="trip_card_image">
                      <div className="trip_duration_badge">
                        {trip.days || "0"} days
                      </div>
                    </div>

                    <div className="trip_menu">
                      <button
                        className="trip_menu_button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(
                            openDropdownId === trip.id ? null : trip.id
                          );
                        }}
                      >
                        ⋮
                      </button>
                      {openDropdownId === trip.id && (
                        <div className="trip_dropdown">
                          <button
                            className="dropdown_item edit_item"
                            onClick={() => {
                              handleEditTrip(trip);
                              setOpenDropdownId(null);
                            }}
                          >
                            Edit Trip
                          </button>
                          <button
                            className="dropdown_item delete_item"
                            onClick={() => {
                              handleDeleteTrip(trip.id);
                              setOpenDropdownId(null);
                            }}
                          >
                            Delete Trip
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="trip_card_content">
                      <h3 className="trip_card_title">{trip.name}</h3>
                      <div className="trip_location">
                        📍{" "}
                        {trip.locations
                          ? trip.locations.join(", ")
                          : "Location not set"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* End trip_cards */}

            {/* Modal for creating or editing trips */}

          </div>
          {isModalOpen && (
            <Popup
            title=""
            buttons={
              <>
                <button type="submit" form="trip-form">
                  Save
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </>
            }
          >
            <div
              className="modal_content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{editingTrip ? "Edit Trip" : "Create New Trip"}</h2>
              <form
                id="trip-form" 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const tripData = {
                    id: editingTrip?.id,
                    tripName: formData.get("name"),
                    tripLocation: formData.get("locations"),
                    tripStartDate: formData.get("startDate"),
                    days: parseInt(formData.get("days"), 10),
                  };
          
                  try {
                    if (editingTrip) {
                      await updateTrip(tripData);
                      console.log("Trip updated:", tripData);
                    } else {
                      await createTrip(tripData);
                      console.log("Trip created:", tripData);
                    }
                    setIsModalOpen(false);
                  } catch (err) {
                    console.error("Failed to save trip:", err);
                    alert(err.message);
                  }
                }}
              >
                <input
                  name="name"
                  placeholder="Trip Name"
                  defaultValue={editingTrip?.tripName || ""}
                  required
                />
                <input
                  name="locations"
                  placeholder="Location"
                  defaultValue={editingTrip?.tripLocation || ""}
                  required
                />
                <input
                  name="startDate"
                  type="date"
                  defaultValue={editingTrip?.tripStartDate || ""}
                  required
                />
                <input
                  name="days"
                  type="number"
                  placeholder="Number of Days"
                  defaultValue={editingTrip?.days || ""}
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
