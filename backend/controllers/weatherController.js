import axios from "axios";

const WEATHER_API = process.env.WEATHER_API;

export const getWeatherForecast = async (req, res) => {
    function getDaysBetweenDates(startDate, endDate) {
        const date1 = new Date(startDate);
        const date2 = new Date(endDate);

        const milliseconds1 = date1.getTime();
        const milliseconds2 = date2.getTime();

        const differenceInMilliseconds = Math.abs(milliseconds2 - milliseconds1);
        const millisecondsInADay = 1000 * 60 * 60 * 24;

        const differenceInDays = differenceInMilliseconds / millisecondsInADay;
        return Math.round(differenceInDays);
    }

    try {
        const { tripLocation, tripDays } = req.body;

        if (!tripLocation || !tripDays) {
            return res
                .status(400)
                .json({ error: "Missing destination ${tripLocation} or ${tripDays} in params" });
        }

        const currentDate = new Date()
        console.log("currentDate: ", currentDate);
        console.log("tripDays[0]: ", new Date(tripDays[0]));
        console.log("difference: " + (getDaysBetweenDates(new Date(tripDays[tripDays.length-1]), currentDate)));

        if (currentDate > new Date(tripDays[tripDays.length - 1])) {
            return res.status(400).json({ error: "Trip date is in the past" });
        }


        const url = "https://api.weatherapi.com/v1/future.json";
        const dailyValues = [];
        console.log(`Fetching weather for ${tripLocation} between days ${tripDays[0]} and ${tripDays[tripDays.length - 1]}...`);

        const month = new Date(tripDays[0]).getMonth() + 1;
        let season = ""

        if (month === 12 || month === 1 || month === 2) {
            season = "winter"
        } else if (month >= 3 && month <= 5) {
            season = "spring"
        } else if (month >= 6 && month <= 8) {
            season = "summer"
        } else {
            season = "fall";
        }

        for (const dt of tripDays) {

            const { data } = await axios.get(url, {
                params: {
                    key: WEATHER_API,
                    q: tripLocation,
                    dt,
                },
            });

            const forecastDay = data?.forecast?.forecastday?.[0];
            if (!forecastDay || !forecastDay.day) {
                console.log("No forecast for:", dt);
                continue;
            }

            const d = forecastDay.day;

            dailyValues.push({
                date: forecastDay.date,
                max_temp_c: d.maxtemp_c,
                min_temp_c: d.mintemp_c,
                max_temp_f: d.maxtemp_f,
                min_temp_f: d.mintemp_f,
                avg_humidity: d.avghumidity,
                rain_chance: Number(d.daily_chance_of_rain || 0), // 0–100
            });
        }

        if (dailyValues.length === 0) {
            return res
                .status(404)
                .json({ error: "No forecast data available for the given dates" });
        }

        const avg = (arr) =>
            arr.reduce((sum, v) => sum + v, 0) / arr.length;

        const highsF = dailyValues.map((d) => d.max_temp_f);
        const lowsF = dailyValues.map((d) => d.min_temp_f);
        const highsC = dailyValues.map((d) => d.max_temp_c);
        const lowsC = dailyValues.map((d) => d.min_temp_c);
        const humidity = dailyValues.map((d) => d.avg_humidity);
        const rainChances = dailyValues.map((d) => d.rain_chance);

        const summary = {
            avg_high_f: Math.round(avg(highsF)),
            avg_low_f: Math.round(avg(lowsF)),
            avg_high_c: Math.round(avg(highsC)),
            avg_low_c: Math.round(avg(lowsC)),
            avg_humidity: Math.round(avg(humidity)),
            avg_rain_chance: Math.round(avg(rainChances)),
            season: season,
        };

        return res.json({
            daily_raw: dailyValues,
            summary,
        });
    } catch (err) {
        console.error("Weather error:", err.response?.data || err.message);
        return res.status(500).json({ error: "Failed to fetch weather" });
    }
};

