import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../Constants";

const API_BASE_URL = (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL);

export async function getWeather(activityLocations, tripDaysDates, tripDaysKeys) {
    const res = await fetch(`${API_BASE_URL}/weather/getWeather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // if needed
        body: JSON.stringify({
            activityLocations,
            tripDaysDates,
            tripDaysKeys
        }),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Weather fetch failed");
    }

    return res.json();
}