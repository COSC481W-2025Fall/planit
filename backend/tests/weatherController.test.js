import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import {getWeatherForecast} from "../controllers/weatherController.js";

vi.mock("axios");

describe("getWeatherForecast controller tests", () => {
    let req;
    let res;

    beforeEach(() => {
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };

        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("returns 400 when required body fields are missing", async () => {
        req = { body: {} };

        await getWeatherForecast(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: "Missing destination ${tripLocation} or ${tripDaysDates} in params",
        });
    });

    test("returns 404 when no forecast data is available", async () => {
        req = {
            body: {
                activityLocations: [""],
                tripDaysDates: ["2025-01-05"],
                tripDaysKeys: [123],
            },
        };

        axios.get.mockResolvedValueOnce({
            data: {
                forecast: {
                    forecastday: [],
                },
            },
        });

        await getWeatherForecast(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: "No forecast data available for the given dates",
        });
    });

    test("returns 200 with daily_raw and summary for a single day", async () => {
        req = {
            body: {
                activityLocations: "Chicago, IL",
                tripDaysDates: "2025-01-05",
                tripDaysKeys: 123,
            },
        };

        axios.get.mockResolvedValueOnce({
            data: {
                forecast: {
                    forecastday: [
                        {
                            date: "2025-01-05",
                            day: {
                                maxtemp_c: 10,
                                mintemp_c: 0,
                                maxtemp_f: 50,
                                mintemp_f: 32,
                                avghumidity: 70,
                                daily_chance_of_rain: 40,
                                condition: {
                                    icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
                                },
                            },
                        },
                    ],
                },
            },
        });

        await getWeatherForecast(req, res);

        expect(res.status).not.toHaveBeenCalledWith(400);
        expect(res.status).not.toHaveBeenCalledWith(404);

        expect(res.json).toHaveBeenCalledTimes(1);
        const payload = res.json.mock.calls[0][0];

        expect(payload.daily_raw).toHaveLength(1);
        expect(payload.daily_raw[0]).toEqual({
            date: "2025-01-05",
            max_temp_c: 10,
            min_temp_c: 0,
            max_temp_f: 50,
            min_temp_f: 32,
            avg_humidity: 70,
            rain_chance: 40,
            condition_icon: "cdn.weatherapi.com/weather/64x64/day/113.png",
            day_id: 123,
        });

        expect(payload.summary).toEqual(
            expect.objectContaining({
                avg_high_f: 50,
                avg_low_f: 32,
                avg_high_c: 10,
                avg_low_c: 0,
                avg_humidity: 70,
                avg_rain_chance: 40,
                season: "winter",
            })
        );
    });

    test("returns 200 with daily_raw and summary for multiple days", async () => {
        req = {
            body: {
                activityLocations: [
                    "Chicago, IL",
                    "Chicago, IL",
                    "Chicago, IL",
                ],
                tripDaysDates: [
                    "2025-01-05",
                    "2025-01-06",
                    "2025-01-07",
                ],
                tripDaysKeys: [101, 102, 103],
            },
        };

        // one mock used for all axios.get calls
        axios.get.mockResolvedValue({
            data: {
                forecast: {
                    forecastday: [
                        {
                            date: "2025-01-05",
                            day: {
                                maxtemp_c: 10,
                                mintemp_c: 0,
                                maxtemp_f: 50,
                                mintemp_f: 32,
                                avghumidity: 70,
                                daily_chance_of_rain: 40,
                                condition: {
                                    icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
                                },
                            },
                        },
                        {
                            date: "2025-01-06",
                            day: {
                                maxtemp_c: 8,
                                mintemp_c: -1,
                                maxtemp_f: 46,
                                mintemp_f: 30,
                                avghumidity: 60,
                                daily_chance_of_rain: 20,
                                condition: {
                                    icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
                                },
                            },
                        },
                        {
                            date: "2025-01-07",
                            day: {
                                maxtemp_c: 12,
                                mintemp_c: 1,
                                maxtemp_f: 54,
                                mintemp_f: 34,
                                avghumidity: 80,
                                daily_chance_of_rain: 60,
                                condition: {
                                    icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
                                },
                            },
                        },
                    ],
                },
            },
        });

        await getWeatherForecast(req, res);

        expect(res.json).toHaveBeenCalledTimes(1);

        const payload = res.json.mock.calls[0][0];

        expect(Array.isArray(payload.daily_raw)).toBe(true);
        expect(payload.daily_raw.length).toBeGreaterThanOrEqual(1);

        expect(payload.daily_raw[0]).toEqual(
            expect.objectContaining({
                date: "2025-01-05",
                max_temp_c: 10,
                min_temp_c: 0,
                max_temp_f: 50,
                min_temp_f: 32,
                avg_humidity: 70,
                rain_chance: 40,
                condition_icon: "cdn.weatherapi.com/weather/64x64/day/113.png",
            })
        );

        expect(payload.daily_raw.length).toEqual(3);

        // summary has key fields
        expect(payload.summary).toEqual(
            expect.objectContaining({
                avg_high_f: expect.any(Number),
                avg_low_f: expect.any(Number),
                avg_high_c: expect.any(Number),
                avg_low_c: expect.any(Number),
                avg_humidity: expect.any(Number),
                avg_rain_chance: expect.any(Number),
                season: "winter",
            })
        );
    });

    test("returns 500 when the Weather API request fails", async () => {
        req = {
            body: {
                activityLocations: "Chicago, IL",
                tripDaysDates: "2027-01-05",
                tripDaysKeys: 123,
            },
        };

        axios.get.mockRejectedValueOnce(new Error("Weather API failed"));

        await getWeatherForecast(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Failed to fetch weather",
        });
    });
});