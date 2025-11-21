import { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import "../css/Popup.css";
import Popup from "../components/Popup";
import { LOCAL_BACKEND_URL, VITE_BACKEND_URL } from "../../../Constants.js";

export default function CloneTripButton({ user, tripId, access, fromExplore, onCloned, trip }) {
    const [open, setOpen] = useState(false);
    const [newStartDate, setNewStartDate] = useState(null);
    const [newTripName, setNewTripName] = useState("");
    const [dayCount, setDayCount] = useState(null);
    const [loading, setLoading] = useState(false);
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
    }

    return (
        <>
            <button onClick={openModal} className="clone-btn">
                Clone Trip
            </button>

            {open && (
                <Popup
                    title="Clone Trip"
                    onClose={() => setOpen(false)}
                    buttons={[
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
                    <div className="popup-body-text">
                        This trip is {dayCount} day(s) long.
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
                            className="popup-datepicker"
                            dateFormat="MM-dd-yyyy"
                            required
                        />
                    </div>
                </Popup>
            )}
        </>
    );
}