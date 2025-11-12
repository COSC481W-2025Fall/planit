import { VITE_BACKEND_URL, LOCAL_BACKEND_URL } from "../../Constants";

const API_BASE_URL = (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL);

// Get all trips for user
export async function getTrips(user_id) {
  const res = await fetch(`${API_BASE_URL}/trip/readAll?user_id=${user_id}`, {
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
    tripEndDate: trip.trip_end_date,
    user_id: trip.user_id,
    days: trip.days,
    imageid: trip.image_id,
    isPrivate: trip.isPrivate
  };

  const res = await fetch(`${API_BASE_URL}/trip/create`, {
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
    imageid: trip.image_id,
    tripName: trip.trip_name,
    tripLocation: trip.trip_location,
    tripStartDate: trip.trip_start_date,
    user_id: trip.user_id,
    days: trip.days,
    isPrivate: trip.isPrivate
  };

  const res = await fetch(`${API_BASE_URL}/trip/update`, {
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
  const res = await fetch(`${API_BASE_URL}/trip/delete`, {
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

// get all trips shared with the user
export async function getSharedTrips(user_id) {
  const res = await fetch(`${API_BASE_URL}/shared/readAllSharedTrips?user_id=${user_id}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch trips");
  }
  return await res.json();
}

//list all participants for a trip
export async function listParticipants(tripId) {
  const res = await fetch(`${API_BASE_URL}/shared/listParticipants?tripId=${tripId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch participants");
  }
  return await res.json();
}

// Add participant to a trip
export async function addParticipant(tripId, username) {
  const res = await fetch(`${API_BASE_URL}/shared/addParticipant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ tripId, username }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add participant");
  }
  return await res.json();
}

// Remove participant from a trip
export async function removeParticipant(tripId, username) {
  const res = await fetch(`${API_BASE_URL}/shared/removeParticipant`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ tripId, username }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove participant");
  }
  return await res.json();
}

//Get the owner of the trip for display purposes
export async function getOwnerForTrip(tripId) {
  const res = await fetch(`${API_BASE_URL}/trip/owner/${tripId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch owner for trip");
  }
  return await res.json();
}