import React from "react";
import "../css/TripPage.css";
import { useState } from "react";
import { useEffect } from "react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";

export default function TripPage() {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);



  // run this code when the component first loads
  useEffect(() => {
    // make a request to the backend and include cookies for authentication
    fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/login/details", { credentials: "include" })
      .then((res) => res.json())

      // convert the server response into a javascript object
      .then((data) => {
        // once the data is ready, check if the user is logged in

        // if not logged in, stop here and do nothing
        if (data.loggedIn === false) return;

        // if logged in, save user info in state so the component can use it
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
    const handleSaveTrip = (tripData) => {
      if (editingTrip) {
        //Update exisiting trip
        setTrips(trips.map(trip =>
          trip.id === editingTrip.id ? { ...tripData, id: editingTrip.id } : trip
        ));
      }
      else {
        //create new trip
        setTrips([...trips, { ...tripData, id: Date.now() }]);
      }
    //Close modal and reset editing
    setEditingTrip(null);
    setIsModalOpen(false);
  }
  // the empty array means this effect only runs once when the component loads
  useEffect(() => {
    fetch((import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/auth/user/trips", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn === false) return;
        setTrips(data.trips);
      })
      .catch(err => console.log("Failed to fetch trips:", err));
  }, []); 
  


  // FRONTEND TEAM - MAKE A CUSTOM LOADER OR SOMETHING
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="trip_page">
      {/* Top banner: logo, sign out, and profile picture */}
      <div className="top_banner">
        <div className="name">PlanIt</div>
        <button className="sign_out" onClick={() => window.location.href = "/"}>Sign Out</button>
        <img className="pfp" src={user.photo} alt="Profile" />
      </div>

      <div className="main_content">
        {/* Header */}
        <div className="navigation_menu">
          <a className="nav_link" href="trip">My Trips</a>
          <a className="nav_link" href="url">Shared With Me</a>
          <a className="nav_link" href="url">Explore</a>
        </div>

        <div className="trips_section">
          <div className="trips_header">
            <div className="trips_title_section">
            <div className="trips_title">{user.first_name} {user.last_name}'s Trips</div>
            <div className="trips_subtitle">Plan and manage your upcoming trips</div>
            
            </div>
            <button className="new_trip_button" onClick={handleNewTrip}>
                + New Trip
              </button>
            
            
            <div className="banner_controls">
              <button className="filter_button">
                <span className="filter_icon">⚙</span> Filter
              </button>
              

            </div>
          </div>
          {/* Show trips or empty state */}
          <div className="trip_cards">
            {trips.length === 0 ? (
              <div className="empty_state">
                <h3>No trips yet!</h3>
                <div>{user.first_name}, you haven't created any trips! PlanIt now!</div>               
              </div>
              
            ) : (
              trips.map((trip) => (
                <div key={trip.id} className="trip_card">
                  <div className="trip_card_image">
                    <img
                      src={trip.image || ""}
                      alt={trip.name}
                    />
                    <div className="trip_duration_badge">
                      {trip.days || '0'} days
                    </div>
                  </div>
                  <div className="trip_menu">
                      <button
                        className="trip_menu_button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === trip.id ? null : trip.id);
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
                      📍 {trip.locations ? trip.locations.join(', ') : 'Location not set'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Modal for creating or editing trips */}
          {isModalOpen && (
            <div className="modal_overlay" onClick={() => setIsModalOpen(false)}>
              <div className="modal_content" onClick={e => e.stopPropagation()}>
                <h2>{editingTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const tripData = {
                    name: formData.get('name'),
                    locations: formData.get('locations').split(',').map(l => l.trim()),
                    image: formData.get('image'),
                    startDate: formData.get('startDate'),
                    endDate: formData.get('endDate'),
                    days: parseInt(formData.get('days'))
                  };
                  handleSaveTrip(tripData);
                }}>
                  <input
                    name="name"
                    placeholder="Trip Name"
                    defaultValue={editingTrip?.name || ''}
                    required
                  />
                  <input
                    name="locations"
                    placeholder="Locations (comma separated)"
                    defaultValue={editingTrip?.locations?.join(', ') || ''}
                    required
                  />
                  <input
                    name="image"
                    placeholder="Image URL"
                    defaultValue={editingTrip?.image || ''}
                  />
                  <input
                    name="startDate"
                    placeholder="Start Date"
                    defaultValue={editingTrip?.startDate || ''}
                    required
                  />
                  <input
                    name="endDate"
                    placeholder="End Date"
                    defaultValue={editingTrip?.endDate || ''}
                    required
                  />
                  <input
                    name="days"
                    type="number"
                    placeholder="Number of Days"
                    defaultValue={editingTrip?.days || ''}
                    required
                  />
                  <div className="modal_actions">
                    <button type="submit" className="save_button">Save Trip</button>
                    <button type="button" className="cancel_button" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}