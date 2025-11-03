import { VITE_BACKEND_URL, LOCAL_BACKEND_URL } from "../../Constants";

const API_BASE_URL = (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/days";

async function handleResponse(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Request failed");
  }
  return res.status === 204 ? true : res.json();
}

export async function getDays(tripId) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days`, {
    credentials: "include",
  });
  return handleResponse(res);
}

export async function createDay(tripId, { day_date, newDayInsertBefore}) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ day_date, newDayInsertBefore }),
  });
  return handleResponse(res);
}

export async function updateDay(tripId, dayId, { day_date }) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ day_date }),
  });
  return handleResponse(res);
}

export async function deleteDay(tripId, dayId) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res);
}