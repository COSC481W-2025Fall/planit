import { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import "../css/Popup.css";
import Popup from "../components/Popup";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";
import { MoonLoader } from "react-spinners";

export default function CloneTripButton({ user, tripId, access, fromExplore, onCloned, trip }) {
    const [open, setOpen] = useState(false);
    const [newStartDate, setNewStartDate] = useState(null);
    const [newTripName, setNewTripName] = useState("");
    const [dayCount, setDayCount] = useState(null);
    const [loading, setLoading] = useState(false);
    const isMobile = () => window.innerWidth <= 600;
    const BASE = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL;

    useEffect(() => {
        if (trip?.trip_name) {
            setNewTripName(trip.trip_name);
        }
    }, [trip]);

    if (!fromExplore) return null;

    async function openModal() {
        if (!user || user.user_id.toString().startsWith("guest_")) {
            toast.error("Login to clone this trip.");
            return;
        }

        const res = await fetch(`${BASE}/trip/${tripId}/cloneData`, {
            credentials: "include",
        });
        const data = await res.json();
        setDayCount(data.dayCount);
        setOpen(true)
    }

    async function clone() {
        if (!newStartDate) {
            return;
        }

        try{
        setLoading(true);

        const res = await fetch(`${BASE}/trip/${tripId}/clone`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ newStartDate: newStartDate.toISOString().slice(0, 10),
                newTripName
            }),
        });

        const data = await res.json();
        setLoading(false);

        if (data.ok) {
            toast.success("Trip cloned successfully!");
            setOpen(false);
            setTimeout(() => {
                onCloned(data.newTripId);
            }, 50);
        }
        else {
            toast.error("Failed to clone trip.");
        }
        } finally {
            // regardless of what happens still set the loader off
            setLoading(false);
        }
    }

    return (
      <>
          <button onClick={openModal} className="clone-btn">
              Clone Trip
          </button>
          {open && (
            <Popup
              title="Clone Trip"
              onClose={loading ? undefined : () => setOpen(false)}
              buttons={ loading ? [] :[
                  <button key="cancel" onClick={() => setOpen(false)}>
                      Cancel
                  </button>,
                  <button
                    key="clone"
                    className="btn-rightside"
                    disabled={loading || !newStartDate}
                    onClick={clone}
                  >
                      {loading ? "Cloning..." : "Clone"}
                  </button>
              ]}
            >
                {loading ? (
                  <div className = "loading-spinner">
                      <MoonLoader color="var(--accent)" size={50} />
                  </div>
                ) : (
                  <>
                      <div className="popup-body-text">
                          This trip is {dayCount} {dayCount === 1 ? "day" : "days"} long.
                      </div>

                      <div className="popup-input">
                          <span>Trip Name</span>
                          <input
                            type="text"
                            value={newTripName}
                            onChange={(e) => setNewTripName(e.target.value)}
                            className="popup-input-field"
                            required
                          />
                      </div>

                      <div className="popup-input">
                          <span>New Start Date</span>
                          <DatePicker
                            selected={newStartDate}
                            onChange={(date) => setNewStartDate(date)}
                            placeholderText="Choose Start Date"
                            popperPlacement="bottom"
                            className="date-input"
                            dateFormat="MM-dd-yyyy"
                            shouldCloseOnSelect={true}
                            withPortal={isMobile()}
                            portalId="root-portal"
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
                                        {date.toLocaleString("default", { month: "long" })}{" "}
                                          {date.getFullYear()}
                                       </span>
                                      <button type="button" className="month-btn" onClick={increaseMonth}>
                                          <ChevronRight size={20} />
                                      </button>
                                  </div>
                              </div>
                            )}
                          />
                      </div>
                  </>
                )}
            </Popup>
          )}
      </>
    );
}