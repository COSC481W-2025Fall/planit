import axios from "axios";
import {json} from "express";

const WEATHER_API = process.env.WEATHER_API;
const futureAfter14DaysUrl = "https://api.weatherapi.com/v1/future.json";
const forecastWithin14DaysUrl = "https://api.weatherapi.com/v1/forecast.json";
const historyUrl = "https://api.weatherapi.com/v1/history.json";

export const getWeatherForecast = async (req, res) => {
    try {
        const { activityLocations, tripDaysDates, tripDaysKeys } = req.body;

        if (!activityLocations || !tripDaysDates || !tripDaysKeys) {
            return res
                .status(400)
                .json({ error: "Missing destination ${tripLocation} or ${tripDaysDates} in params" });
        }

        const season = getSeason(tripDaysDates, tripDaysKeys)
        let dailyValues = [];

        if (tripDaysKeys.length !== undefined) {
            let index = 0;
            for (const dt of tripDaysDates) {
                const tripLocation = activityLocations[index];
                const dayId = tripDaysKeys[index];

                const value = await getData(tripLocation, dayId, dt);
                if (value) {
                    dailyValues.push(value);
                }

                index++;
            }
        } else {
            dailyValues.push(await getData(activityLocations, tripDaysKeys, tripDaysDates));
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
        const precipitationChances = dailyValues.map((d) => d.avg_precipitation_chance);

        const summary = {
            avg_high_f: Math.round(avg(highsF)),
            avg_low_f: Math.round(avg(lowsF)),
            avg_high_c: Math.round(avg(highsC)),
            avg_low_c: Math.round(avg(lowsC)),
            avg_humidity: Math.round(avg(humidity)),
            avg_precipitation_chance: Math.round(avg(precipitationChances)),
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

function deriveDailyRainChance(forecastDay) {
    const d = forecastDay.day;

    if (typeof d.daily_chance_of_rain === "number" && d.daily_chance_of_rain !== 0) {
        if (typeof d.daily_chance_of_snow === "number" && d.daily_chance_of_snow !== 0){
            return d.daily_chance_of_rain > d.daily_chance_of_snow ? d.daily_chance_of_rain : d.daily_chance_of_snow
        } else {
            return d.daily_chance_of_rain;
        }
    }

    const hours = forecastDay.hour || [];
    if (!hours.length) return 0;

    const hourlyPrecipChances = hours.map((h) => {
        const rain = typeof h.chance_of_rain === "number" ? h.chance_of_rain : 0;
        const snow = typeof h.chance_of_snow === "number" ? h.chance_of_snow : 0;

        const pRain = Math.min(Math.max(rain / 100, 0), 1);
        const pSnow = Math.min(Math.max(snow / 100, 0), 1);

        const noPrecip = (1 - pRain) * (1 - pSnow);
        const precipitationPercentage = 1 - noPrecip;

        return precipitationPercentage * 100;
    });

    if (!hourlyPrecipChances.length) return 0;

    const maxChance = Math.max(...hourlyPrecipChances);
    const avgChance =
        hourlyPrecipChances.reduce((sum, v) => sum + v, 0) / hourlyPrecipChances.length;

    const blendedMaxAndAverage = 0.6 * maxChance + 0.4 * avgChance;

    return Math.round(blendedMaxAndAverage);
}

function getDaysBetweenDates(startDate, endDate) {
    const [y1, m1, d1] = startDate.split("-").map(Number);
    const [y2, m2, d2] = endDate.split("-").map(Number);

    const t1 = Date.UTC(y1, m1 - 1, d1);
    const t2 = Date.UTC(y2, m2 - 1, d2);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.round((t2 - t1) / MS_PER_DAY);
}

function getSeason(tripDaysDates, tripDaysKeys) {
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

    return season;
}

async function getData(tripLocation, dayId, dateToRetrieveData) {
    let isPast365Days = false;

    let isFuture = false;
    let isForecast = false;
    let isHistory = false;
    let currentDate = new Date().toISOString().split("T")[0];
    let eachDateString = new Date(dateToRetrieveData).toISOString().split("T")[0];

    const numOfDaysDifference = getDaysBetweenDates(currentDate, eachDateString);

    if (currentDate <= eachDateString) {
        if (numOfDaysDifference <= 14) {
            isForecast = true;
        } else {
            isFuture = true;
        }

    } else if (currentDate > eachDateString) {
        isHistory = true;
    }

    if (numOfDaysDifference >= 365) {
        isPast365Days = true;
    }

    if (tripLocation === null) {
        return;
    }

    let data;

    if (!isPast365Days) {
        if (isForecast) {
            const response = await axios.get(forecastWithin14DaysUrl, {
                params: {
                    key: WEATHER_API,
                    q: tripLocation,
                    days: 1,
                    dt: dateToRetrieveData,
                },
            });
            data = response.data;
        }
        else if (isFuture) {
            const response = await axios.get(futureAfter14DaysUrl, {
                params: {
                    key: WEATHER_API,
                    q: tripLocation,
                    dt: dateToRetrieveData,
                },
            });
            data = response.data;
        }
        else if (isHistory) {
            const response = await axios.get(historyUrl, {
                params: {
                    key: WEATHER_API,
                    q: tripLocation,
                    dt: dateToRetrieveData,
                },
            });
            data = response.data;
        }
    }


    const forecastDay = data?.forecast?.forecastday?.[0];
    if (!forecastDay || !forecastDay.day) {
        return;
    }

    const d = forecastDay.day;
    const c = forecastDay.day.condition;

    return {
        date: forecastDay.date,
        max_temp_c: d.maxtemp_c,
        min_temp_c: d.mintemp_c,
        max_temp_f: d.maxtemp_f,
        min_temp_f: d.mintemp_f,
        avg_humidity: d.avghumidity,
        avg_precipitation_chance: deriveDailyRainChance(forecastDay),
        condition_icon: c.icon.split("//")[1],
        day_id: dayId
    };
}
