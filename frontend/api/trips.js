import { VITE_BACKEND_URL, LOCAL_BACKEND_URL } from "../../Constants"; 

const API_BASE_URL = import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL + "/trips";

// Frontend function to create a new trip
export async function createTrip({ days, tripName, tripStartDate, tripLocation }) {
  const res = await fetch(`${API_BASE_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ days, tripName, tripStartDate, tripLocation }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error||  "Failed to create trip");
  }
  console.log("JSON String",res.body);
  return await res.json();
}

// Frontend function to update an existing trip
export async function updateTrip({ id, days, tripName, tripStartDate, tripLocation }) {
  const res = await fetch(`${API_BASE_URL}/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id, days, tripName, tripStartDate, tripLocation }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update trip");
  }
  return await res.json();
}

// Frontend function to read a trip given trip id
export async function readTrip(tripId) {
  const res = await fetch(`${API_BASE_URL}/read/${tripId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch trip");
  }
  return await res.json();
}

// Frontend function to delete a trip given trip id
export async function deleteTrip(id) {
  const res = await fetch(`${API_BASE_URL}/delete`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete trip");
  }
  return await res.json();
}