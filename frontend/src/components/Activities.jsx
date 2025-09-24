import React, { useState } from "react";
import "./Activities.css";

export default function Activities() {
  // local state with two mock activities
  const [activities, setActivities] = useState([
    {
      id: 1,
      title: "Redwood National Park",
      startTime: "10:00 AM",
      duration: "3 hours",
      cost: 25,
      location: "Crescent City, California",
    },
    {
      id: 2,
      title: "Museum",
      startTime: "9:00 AM",
      duration: "2 hours",
      cost: 20,
      location: "San Francisco, California",
    },
  ]);

  // add new activity (temporary, local only)
  const handleAdd = () => {
    const newActivity = {
      id: Date.now(), // unique id based on timestamp
      title: "New Activity",
      startTime: "2:00 PM",
      duration: "1 hour",
      cost: 0,
      location: "Unknown",
    };
    setActivities((prev) =>
      [...prev, newActivity].sort(
        (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
      )
    );
  };

  // delete activity by id
  const handleDelete = (id) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  // update a single field (title, cost, startTime) for an activity
  const handleUpdate = (id, field, value) => {
    setActivities((prev) =>
      prev
        .map((a) => (a.id === id ? { ...a, [field]: value } : a))
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
    );
  };

  return (
    <div className="activities-container">
      <h2 className="activities-title">Activities</h2>

      {/* activity count */}
      <span className="badge">
        {activities.length} {activities.length === 1 ? "activity" : "activities"}
      </span>

      {/* render all activity cards */}
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          {...activity}
          onDelete={() => handleDelete(activity.id)}
          onUpdate={(field, value) => handleUpdate(activity.id, field, value)}
        />
      ))}

      {/* add activity button */}
      <button className="add-btn" onClick={handleAdd}>
        + Add Activity
      </button>
    </div>
  );
}

function ActivityCard({
  title,
  startTime,
  duration,
  cost,
  location,
  onDelete,
  onUpdate,
}) {
  const [menuOpen, setMenuOpen] = useState(false); // toggle for dropdown
  const [editingField, setEditingField] = useState(null); // which field is being edited

  return (
    <div className="activity-card">
      {/* edit dropdown button */}
      <button className="edit-btn" onClick={() => setMenuOpen(!menuOpen)}>
        Edit
      </button>

      {/* dropdown menu */}
      {menuOpen && (
        <div className="dropdown">
          <div onClick={() => { setEditingField("title"); setMenuOpen(false); }}>
            Rename Activity
          </div>
          <div onClick={() => { setEditingField("cost"); setMenuOpen(false); }}>
            Edit Cost
          </div>
          <div onClick={() => { setEditingField("startTime"); setMenuOpen(false); }}>
            Edit Start Time
          </div>
          <div className="delete" onClick={onDelete}>
            Delete Activity
          </div>
        </div>
      )}

      {/* title */}
      <h3 className="activity-title">
        {editingField === "title" ? (
          <input
            type="text"
            defaultValue={title}
            autoFocus
            onBlur={(e) => { onUpdate("title", e.target.value); setEditingField(null); }}
            className="input title-input"
          />
        ) : (
          title
        )}
      </h3>

      {/* start time */}
      <p className="activity-detail">
        {editingField === "startTime" ? (
          <input
            type="text"
            defaultValue={startTime}
            autoFocus
            onBlur={(e) => { onUpdate("startTime", e.target.value); setEditingField(null); }}
            className="input"
          />
        ) : (
          startTime
        )}
      </p>

      {/* duration */}
      <p className="activity-detail">{duration}</p>

      {/* location */}
      <p className="activity-detail">{location}</p>

      {/* cost */}
      <div className="activity-cost">
        {editingField === "cost" ? (
          <input
            type="number"
            defaultValue={cost}
            autoFocus
            onBlur={(e) => { onUpdate("cost", e.target.value); setEditingField(null); }}
            className="input cost-input"
          />
        ) : (
          <span>${cost}</span>
        )}
      </div>
    </div>
  );
}

// helper to convert "HH:MM AM/PM" to minutes since midnight 
function parseTime(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}
