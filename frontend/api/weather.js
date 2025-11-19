import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../Constants";

const API_BASE_URL = (import.meta.env.PROD ? VITE_BACKEND_URL : LOCAL_BACKEND_URL);

export async function getWeather(tripLocation, startDate, tripDays) {
    const url = `${API_BASE_URL}/weather/getWeather` +
        `?tripLocation=${tripLocation}&startDate=${startDate}&tripDays=${tripDays}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Weather fetch failed: ${response.statusText}`);
    }

    return response.json(); // { daily_raw: [...], summary: {...} }
}