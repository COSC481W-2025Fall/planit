import { VITE_BACKEND_URL, LOCAL_BACKEND_URL } from "../../Constants";

const API_BASE_URL = (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL) + "/days";

async function handleResponse(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Request failed");
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getDays(tripId) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days`, {
    credentials: "include",
  });
  return handleResponse(res);
}

export async function createDay(tripId, { day_date, newDayInsertBefore}, username) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ day_date, newDayInsertBefore, username }),
  });
  return handleResponse(res);
}

export async function updateDay(tripId, dayId, { day_date, finalUpdate }, username) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ day_date, finalUpdate, username }),
  });
  return handleResponse(res);
}

export async function deleteDay(tripId, dayId, isFirstDay, username) {
  const res = await fetch(`${API_BASE_URL}/trips/${tripId}/days/${dayId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ isFirstDay: isFirstDay, username }),
  });
  return handleResponse(res);
}