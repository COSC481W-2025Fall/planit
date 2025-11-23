import axios from "axios";

const WEATHER_API = process.env.WEATHER_API;

export const getWeatherForecast = async (req, res) => {
    const futureAfter14DaysUrl = "https://api.weatherapi.com/v1/future.json";
    const forecastWithin14DaysUrl = "https://api.weatherapi.com/v1/forecast.json";
    const historyUrl = "https://api.weatherapi.com/v1/history.json";

    try {
        const { activityLocations, tripDaysDates, tripDaysKeys } = req.body;

        if (!activityLocations || !tripDaysDates || !tripDaysKeys) {
            return res
                .status(400)
                .json({ error: "Missing destination ${tripLocation} or ${tripDaysDates} in params" });
        }

        // detect season
        let month;
        tripDaysKeys.length !== undefined ? month = new Date(tripDaysDates[0]).getMonth() + 1 : month = new Date(tripDaysDates).getMonth() + 1;

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

        console.log(`Starting weather fetch between days ${tripDaysDates[0]} and ${tripDaysDates[tripDaysDates.length - 1]}...`);

        const dailyValues = [];

        if (tripDaysKeys.length !== undefined) {
            let index = 0;
            for (const dt of tripDaysDates) {
                const tripLocation = activityLocations[index];
                const dayId = tripDaysKeys[index];

                let isFuture = false;
                let isForecast = false;
                let isHistory = false;
                let currentDate = new Date().toISOString().split("T")[0];
                let eachDateString = new Date(dt).toISOString().split("T")[0];

                const numOfDaysDifference = getDaysBetweenDates(currentDate, eachDateString);

                if (currentDate <= eachDateString) {
                    if (numOfDaysDifference <= 14) {
                        isFuture = true;
                    } else {
                        isForecast = true;
                    }

                } else if (currentDate > eachDateString) {
                    isHistory = true;
                }

                console.log(`Fetching weather for ${tripLocation} on ${dt}...`);

                if (tripLocation === null) {
                    console.log(`No location for ${dt}, therefore no forecast.`);
                    index++;
                    continue;
                }

                let data;

                if (isFuture) {
                    const response = await axios.get(forecastWithin14DaysUrl, {
                        params: {
                            key: WEATHER_API,
                            q: tripLocation,
                            dt,
                        },
                    });
                    data = response.data;
                }
                if (isForecast) {
                    const response = await axios.get(futureAfter14DaysUrl, {
                        params: {
                            key: WEATHER_API,

                            q: tripLocation,
                            days: 1,
                            dt,
                        },
                    });
                    data = response.data;
                }
                if (isHistory) {
                    const response = await axios.get(historyUrl, {
                        params: {
                            key: WEATHER_API,

                            q: tripLocation,
                            dt,
                        },
                    });
                    data = response.data;
                }

                const forecastDay = data?.forecast?.forecastday?.[0];
                if (!forecastDay || !forecastDay.day) {
                    console.log("No forecast for:", dt);
                    continue;
                }

                const d = forecastDay.day;
                const c = forecastDay.day.condition;

                dailyValues.push({
                    date: forecastDay.date,
                    max_temp_c: d.maxtemp_c,
                    min_temp_c: d.mintemp_c,
                    max_temp_f: d.maxtemp_f,
                    min_temp_f: d.mintemp_f,
                    avg_humidity: d.avghumidity,
                    rain_chance: Number(d.daily_chance_of_rain || 0), // 0–100
                    condition_icon: c.icon.split("//")[1],
                    day_id: dayId
                });
                index++;
            }
        } else {
            const tripLocation = activityLocations;
            const dayId = tripDaysKeys;

            let isFuture = false;
            let isForecast = false;
            let isHistory = false;
            let currentDate = new Date().toISOString().split("T")[0];
            let eachDateString = new Date(tripDaysDates).toISOString().split("T")[0];

            const numOfDaysDifference = getDaysBetweenDates(currentDate, eachDateString);

            if (currentDate <= eachDateString) {
                if (numOfDaysDifference <= 14) {
                    isFuture = true;
                } else {
                    isForecast = true;
                }

            } else if (currentDate > eachDateString) {
                isHistory = true;
            }

            console.log(`Fetching weather for ${tripLocation} on ${tripDaysDates}...`);

            if (tripLocation === null){
                console.log(`No location for ${tripDaysDates}, therefore no forecast.`);
            }

            let data;

            if (isFuture) {
                const response = await axios.get(forecastWithin14DaysUrl, {
                    params: {
                        key: WEATHER_API,
                        q: tripLocation,
                        tripDaysDates,
                    },
                });
                data = response.data;
            }
            if (isForecast) {
                const response = await axios.get(futureAfter14DaysUrl, {
                    params: {
                        key: WEATHER_API,

                        q: tripLocation,
                        days: 1,
                        tripDaysDates,
                    },
                });
                data = response.data;
            }
            if (isHistory) {
                const response = await axios.get(historyUrl, {
                    params: {
                        key: WEATHER_API,

                        q: tripLocation,
                        tripDaysDates,
                    },
                });
                data = response.data;
            }

            const forecastDay = data?.forecast?.forecastday?.[0];
            if (!forecastDay || !forecastDay.day) {
                console.log("No forecast for:", tripDaysDates);
            }

            const d = forecastDay.day;
            const c = forecastDay.day.condition;

            dailyValues.push({
                date: forecastDay.date,
                max_temp_c: d.maxtemp_c,
                min_temp_c: d.mintemp_c,
                max_temp_f: d.maxtemp_f,
                min_temp_f: d.mintemp_f,
                avg_humidity: d.avghumidity,
                rain_chance: Number(d.daily_chance_of_rain || 0), // 0–100
                condition_icon: c.icon.split("//")[1],
                day_id: dayId
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

function getDaysBetweenDates(startDate, endDate) {
    const [y1, m1, d1] = startDate.split("-").map(Number);
    const [y2, m2, d2] = endDate.split("-").map(Number);

    const t1 = Date.UTC(y1, m1 - 1, d1);
    const t2 = Date.UTC(y2, m2 - 1, d2);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.round((t2 - t1) / MS_PER_DAY);
}

