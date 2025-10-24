import {render, screen, waitFor} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import TripDaysPage from "../pages/TripDaysPage";
import * as daysApi from "../../api/days";
import {MemoryRouter, Route, Routes} from "react-router-dom";

global.fetch = vi.fn((url) => {
    if (url.includes("/auth/login/details")) {
        return Promise.resolve({
            json: () => Promise.resolve({loggedIn: true, username: "testUser"}),
        });
    }
    if (url.includes("/trip/read/1")) {
        return Promise.resolve({
            json: () =>
                Promise.resolve({
                    trip_id: "1",
                    trip_name: "Summer Vacation",
                    trip_location: "Hawaii",
                    trip_start_date: "2025-07-01"
                }),
        });
    }
    if (url.includes("/activities/read/all")) {
        return Promise.resolve({
            json: () => Promise.resolve({activities: []}),
        });
    }
    return Promise.reject(new Error("Unhandled fetch: " + url));
});

//tests for TripDaysPage
describe("TripDaysPage", () => {
    test("displays the correct number of days", async () => {
        // mock results for getDays
        vi.spyOn(daysApi, "getDays").mockResolvedValue([
            {day_id: "1", day_date: "2025-07-01T00:00:00", activities: []},
            {day_id: "2", day_date: "2025-07-02T00:00:00", activities: []},
            {day_id: "3", day_date: "2025-07-03T00:00:00", activities: []},
        ]);

        render(
            <MemoryRouter initialEntries={["/trip/1"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage/>}/>
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText(/Day \d/)).toHaveLength(3); // check that the right amount of days are displayed
            expect(screen.getByText(/Tuesday, Jul 1 - Thursday, Jul 3/i)).toBeInTheDocument(); // and the dates of the trip are displayed
        });

        // check that trip name and location are displayed 
        expect(screen.getByText("Summer Vacation")).toBeInTheDocument();
        expect(screen.getByText("Hawaii")).toBeInTheDocument();
    });

    test("displays the empty state when there are no days", async () => {
        vi.spyOn(daysApi, "getDays").mockResolvedValue([]);

        render(
            <MemoryRouter initialEntries={["/trip/1"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage/>}/>
                </Routes>
            </MemoryRouter>
        );

        // check that the empty state is shown and no days are displayed
        await waitFor(() => {
            expect(screen.getByText(/No days added to your itinerary yet/i)).toBeInTheDocument();
            expect(screen.queryAllByText(/Day \d/)).toHaveLength(0);
        });

        // check that trip details are still correctly displayed
        expect(screen.getByText("Summer Vacation")).toBeInTheDocument();
        expect(screen.getByText("Hawaii")).toBeInTheDocument();
    });

    test("loading screen is displayed when fetching data", async () => {
        vi.spyOn(daysApi, "getDays").mockResolvedValue([]);

        global.fetch = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({
            json: () => Promise.resolve({loggedIn: true, username: "testUser"}),
        }), 100)));

        render(
            <MemoryRouter initialEntries={["/trip/1"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage/>}/>
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId("loader")).toBeInTheDocument();
    });
});