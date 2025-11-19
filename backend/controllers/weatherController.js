import axios from "axios";

const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;

// GET /api/weather?lat=...&lon=...&start=YYYY-MM-DD&end=YYYY-MM-DD
export const getWeatherForecast = async (req, res) => {
    try {
        const { tripLocation, startDate, tripDays } = req.query;

        if (!tripLocation || !startDate || !tripDays) {
            return res
                .status(400)
                .json({ error: "Missing destination or startDate in params" });
        }

        // console.log("tripDays:" + tripDays.toString())

        const url = "https://api.weatherapi.com/v1/future.json";
        const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY;
        const WEATHER_API = process.env.WEATHER_API;
        // console.log("Key:", WEATHER_API); // TEMP TEST
        //
        // console.log("Calling WeatherAPI with:", {
        //     url,
        //     q: tripLocation,
        //     dt: startDate.toString(),
        //     key: WEATHER_API ? "[LOADED]" : "[MISSING]"
        // });

        console.log("tripDays[3].toString()" + tripDays[3].toString())

        const { data } = await axios.get(url, {
            params: {
                q: tripLocation,
                dt: tripDays[3].toString(),
                key: WEATHER_API,
            },
        });

        return res.json(data);

        // const daily = data.daily || [];
        //
        // const startTs = new Date(start).getTime() / 1000;
        // // const endTs = new Date(end).getTime() / 1000;
        //
        // const tripDays = daily.filter(
        //     (d) => d.dt >= startTs && d.dt <= endTs
        // );
        //
        // if (!tripDays.length) {
        //     return res
        //         .status(404)
        //         .json({ error: "No forecast data for this date range" });
        // }
        //
        // const highs = tripDays.map((d) => d.temp.max);
        // const lows = tripDays.map((d) => d.temp.min);
        // const humidity = tripDays.map((d) => d.humidity);
        // const pop = tripDays.map((d) => d.pop ?? 0); // precip probability (0–1)
        //
        // const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        //
        // const summary = {
        //     avg_high: avg(highs),
        //     avg_low: avg(lows),
        //     max_high: Math.max(...highs),
        //     min_low: Math.min(...lows),
        //     avg_humidity: avg(humidity),
        //     max_precip_prob: Math.max(...pop),
        // };
        //
        // return res.json({
        //     daily_raw: tripDays,
        //     summary,
        // });
    } catch (err) {
        console.error("Weather error:", err.response?.data || err.message);
        return res.status(500).json({ error: "Failed to fetch weather" });
    }
};