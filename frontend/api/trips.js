import { VITE_BACKEND_URL, LOCAL_BACKEND_URL } from "../../Constants";

const API_BASE_URL =
  (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/trip";

// Get all trips for user
export async function getTrips(user_id) {
  const res = await fetch(`${API_BASE_URL}/readAll?user_id=${user_id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch trips");
  }
  return await res.json();
}

// Create new trip
export async function createTrip(trip) {
  const payload = {
    tripName: trip.trip_name,
    tripLocation: trip.trip_location,
    tripStartDate: trip.trip_start_date,
    days: trip.days,
    imageid: trip.image_id,
    isPrivate: trip.isPrivate
  };

  const res = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create trip");
  }

  return await res.json();
}

// Update existing trip
export async function updateTrip(trip) {
  const payload = {
    trips_id: trip.trips_id,
    tripName: trip.trip_name,
    tripLocation: trip.trip_location,
    tripStartDate: trip.trip_start_date,
    days: trip.days,
    imageid: trip.image_id,
    isPrivate: trip.isPrivate
  };

  const res = await fetch(`${API_BASE_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update trip");
  }
  return await res.json();
}

// Delete trip
export async function deleteTrip(trips_id) {
  const res = await fetch(`${API_BASE_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ trips_id }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete trip");
  }
  return await res.json();
}
