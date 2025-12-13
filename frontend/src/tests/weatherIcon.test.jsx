import React from "react";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TripDaysPage from "../pages/TripDaysPage.jsx";

vi.mock("../../api/days", () => ({
    getDays: vi.fn(),
    createDay: vi.fn(),
    deleteDay: vi.fn(),
    updateDay: vi.fn(),
}));

vi.mock("../../api/weather.js", () => ({
    getWeather: vi.fn(),
}));

vi.mock("../../api/trips.js", () => ({
    getOwnerForTrip: vi.fn().mockResolvedValue({ owner: [] }),
    retrievePackingItems: vi.fn(),
    updateTrip: vi.fn(),
    listParticipants: vi.fn().mockResolvedValue({ participants: [] }),
    addParticipant: vi.fn(),
    removeParticipant: vi.fn(),
}));

vi.mock("../components/ActivityCard.jsx", () => ({
    default: () => <div data-testid="activity-card" />,
}));

vi.mock("../components/ActivitySearch.jsx", () => ({
    default: ({ onActivityAdded }) => (
        <button
            type="button"
            onClick={() => {
                if (onActivityAdded) {
                    onActivityAdded();
                }
            }}
        >
            Add activity
        </button>
    ),
}));

const { getDays } = await import("../../api/days");
const { getWeather } = await import("../../api/weather.js");

describe("Weather icon tests", () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;

        global.fetch = vi.fn((url, options) => {
            if (url.includes("/auth/login/details")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            loggedIn: true,
                            user_id: 1,
                            first_name: "Test",
                            last_name: "User",
                            username: "testuser",
                        }),
                });
            }

            if (url.includes("/trip/read/123")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            trips_id: 123,
                            trip_name: "Test Trip",
                            trip_location: "Detroit, MI",
                            trip_start_date: "2025-11-27",
                            image_id: null,
                            user_role: "owner",
                        }),
                });
            }

            if (url.includes("/activities/read/all")) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            activities: [
                                {
                                    activity_id: 10,
                                    activity_name: "Test Activity",
                                    activity_startTime: "10:00:00",
                                    activity_types: "Hiking",
                                    activity_address: "Detroit, MI",
                                },
                            ],
                        }),
                });
            }

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });

        getDays.mockResolvedValue([
            {
                day_id: 1,
                day_date: "2025-11-27",
            },
        ]);

        getWeather.mockResolvedValue({
            summary: {
                avg_high_f: 40,
                avg_low_f: 30,
                avg_high_c: 4,
                avg_low_c: -1,
                avg_humidity: 70,
                avg_precipitation_chance: 30,
                season: "fall",
            },
            daily_raw: [
                {
                    day_id: 1,
                    date: "2025-11-27",
                    max_temp_c: 4,
                    min_temp_c: -1,
                    max_temp_f: 40,
                    min_temp_f: 30,
                    avg_humidity: 70,
                    avg_precipitation_chance: 30,
                    condition_icon: "cdn.weatherapi.com/weather/64x64/day/113.png",
                },
            ],
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.clearAllMocks();
    });

    function renderWithRouter() {
        return render(
            <MemoryRouter initialEntries={["/trip/123"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage />} />
                </Routes>
            </MemoryRouter>
        );
    }

    test("shows a weather icon on the day card when weather data exists", async () => {
        renderWithRouter();

        const img = await screen.findByAltText("Weather icon", {}, { timeout: 3000 });

        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute(
            "src",
            "https://cdn.weatherapi.com/weather/64x64/day/113.png"
        );
    });

    test("after activity is added then it shows the weather icon", async () => {
        getWeather.mockResolvedValueOnce({
            summary: null,
            daily_raw: [
                {
                    date: "2025-11-27",
                    condition_icon: "cdn.weatherapi.com/weather/64x64/day/116.png",
                    day_id: 1,
                },
            ],
        });

        let activitiesReturned = false;

        global.fetch.mockImplementation((url) => {
            if (url.includes("/auth/login/details")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        loggedIn: true,
                        user_id: 1,
                        first_name: "Test",
                        last_name: "User",
                        username: "testuser",
                    }),
                });
            }

            if (url.includes("/trip/read/123")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        trips_id: 123,
                        trip_name: "Test Trip",
                        trip_location: "Detroit, MI",
                        trip_start_date: "2025-11-27",
                        image_id: null,
                        user_role: "owner",
                    }),
                });
            }

            if (url.includes("/activities/read/all")) {
                if (activitiesReturned) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            activities: [
                                {
                                    activity_id: 10,
                                    activity_name: "Test Activity",
                                    activity_startTime: "10:00:00",
                                    activity_types: "Hiking",
                                    activity_address: "Detroit, MI",
                                },
                            ],
                        }),
                    });
                } else {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ activities: [] }),
                    });
                }
            }

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });

        renderWithRouter();

        await screen.findByText("Itinerary");
        expect(screen.queryByAltText("Weather icon")).not.toBeInTheDocument();

        // open the ActivitySearch drawer
        const addActivityButton = screen.getByText("+ Add Activity");
        fireEvent.click(addActivityButton);

        activitiesReturned = true;

        const mockAddActivityButton = await screen.findByText("Add activity");
        fireEvent.click(mockAddActivityButton);

        // Wait for the weather icon to appear
        const icon = await screen.findByAltText("Weather icon", {}, { timeout: 5000 });
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute(
            "src",
            "https://cdn.weatherapi.com/weather/64x64/day/116.png"
        );
    });

    test("does not fetch weather when trip start is more than a year in the future", async () => {
        getDays.mockResolvedValue([
            {
                day_id: 1,
                day_date: "2090-01-01", // >> 365 days from now
            },
        ]);

        renderWithRouter();
        await screen.findByText("Itinerary");

        // getWeather should NOT be called.
        await waitFor(() => {
            expect(getWeather).not.toHaveBeenCalled();
        });

        // there should be no weather icon rendered on the day card
        expect(screen.queryByAltText("Weather icon")).not.toBeInTheDocument();
    });

    test("does not return weather when trip has no activities", async () => {
        getDays.mockReset()
        getDays.mockResolvedValue([
            {
                day_id: 1,
                day_date: "2025-01-01",
            },
        ]);

        // override fetch so /activities/read/all returns NO activities
        global.fetch.mockImplementation((url, options) => {
            if (url.includes("/auth/login/details")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        loggedIn: true,
                        user_id: 1,
                        username: "testuser",
                    }),
                });
            }

            if (url.includes("/trip/read/123")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        trips_id: 123,
                        trip_name: "Test Trip",
                        trip_location: "Detroit, MI",
                        trip_start_date: "2025-01-01",
                        user_role: "owner",
                    }),
                });
            }

            if (url.includes("/activities/read/all")) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ activities: [] }),
                });
            }

            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });

        getWeather.mockClear();
        renderWithRouter();

        await screen.findByText("Itinerary");

        // no weather icon is rendered
        expect(screen.queryByAltText("Weather icon")).not.toBeInTheDocument();
    });
});