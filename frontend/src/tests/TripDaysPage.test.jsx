import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import TripDaysPage from "../pages/TripDaysPage";
import * as daysApi from "../../api/days";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import * as tripsApi from "../../api/trips";

let mockedDays = [];

// Mock fetch for getDays API
vi.spyOn(daysApi, "getDays").mockImplementation(() => Promise.resolve(mockedDays));
vi.spyOn(daysApi, "createDay").mockResolvedValue({});
vi.spyOn(daysApi, "deleteDay").mockResolvedValue({});
vi.spyOn(daysApi, "updateDay").mockResolvedValue({});

// Mock fetch for user authentication and trip details
vi.spyOn(tripsApi, "listParticipants").mockResolvedValue([]);
vi.spyOn(tripsApi, "addParticipant").mockResolvedValue({});
vi.spyOn(tripsApi, "removeParticipant").mockResolvedValue({});
vi.spyOn(tripsApi, "getOwnerForTrip").mockResolvedValue({ owner_id: "1" });

global.fetch = vi.fn((url) => {
    if (url.includes("/auth/login/details")) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    loggedIn: true,
                    username: "testUser",
                    user_id: "1",
                    user_role: "owner"
                }),
        });
    }
    if (url.includes("/trip/read/1")) {
        return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
                Promise.resolve({
                    trips_id: "1",
                    trip_id: "1",
                    trip_name: "Summer Vacation",
                    trip_location: "Hawaii",
                    trip_start_date: "2025-07-01",
                    user_role: "owner"
                }),
        });
    }
    if (url.includes("/activities/read/all")) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ activities: [] }),
        });
    }
    if (url.includes("/shared/all/usernames")) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
        });
    }
    if (url.includes("/transport/readTransportInfo")) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ transportInfo: [] }),
        });
    }
    if (url.includes("/transport/readAccommodationInfo")) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ accommodationInfo: [] }),
        });
    }
    return Promise.reject(new Error("Unhandled fetch: " + url));
});

//tests for TripDaysPage
describe("TripDaysPage", () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        mockedDays = [];
    });

    test("displays the correct number of days", async () => {
        // mock results for getDays
        mockedDays = [
            { day_id: "1", day_date: "2025-07-01T00:00:00", activities: [] },
            { day_id: "2", day_date: "2025-07-02T00:00:00", activities: [] },
            { day_id: "3", day_date: "2025-07-03T00:00:00", activities: [] },
        ]

        render(
            <MemoryRouter initialEntries={["/trip/1"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText(/Day \d/)).toHaveLength(3); // check that the right amount of days are displayed
            expect(screen.getByText(/Tuesday, Jul 1 - Thursday, Jul 3/i)).toBeInTheDocument(); // and the dates of the trip are displayed
        }, { timeout: 5000 });

        // check that trip name and location are displayed 
        expect(screen.getByText("Summer Vacation")).toBeInTheDocument();
        expect(screen.getByText("Hawaii")).toBeInTheDocument();
    });

    test("displays the empty state when there are no days", async () => {
    mockedDays = [];

    render(
        <MemoryRouter initialEntries={["/trip/1"]}>
            <Routes>
                <Route path="/trip/:tripId" element={<TripDaysPage />} />
            </Routes>
        </MemoryRouter>
    );

    // Wait for the page to load and check for empty state
    await waitFor(() => {
        // Just look for the beginning of the text which is always there
        expect(screen.getByText(/No days/i)).toBeInTheDocument();
        expect(screen.queryAllByText(/Day \d/)).toHaveLength(0);
    }, { timeout: 5000 });

    expect(screen.getByText("Summer Vacation")).toBeInTheDocument();
    expect(screen.getByText("Hawaii")).toBeInTheDocument();
});

    test("loading screen is displayed when fetching data", async () => {

        global.fetch = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({
            json: () => Promise.resolve({ loggedIn: true, username: "testUser" }),
        }), 100)));

        render(
            <MemoryRouter initialEntries={["/trip/1"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage />} />
                </Routes>
            </MemoryRouter>
        );

        const loadings = screen.getAllByTestId("loader");
        expect(loadings).toHaveLength(1);
    });

    test("shows CloneTripButton when fromExplore=true", async () => {
        // mock results for getDays
        mockedDays = [
            { day_id: "1", day_date: "2025-07-01T00:00:00", activities: [] }
        ];
        render(
            <MemoryRouter initialEntries={["/trip/1?fromExplore=true"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage />} />
                </Routes>
            </MemoryRouter>
        );
    });

    test("does not show CloneTripButton when fromExplore=false", async () => {
        // mock results for getDays
        mockedDays = [
            { day_id: "1", day_date: "2025-07-01T00:00:00", activities: [] }
        ];

        render(
            <MemoryRouter initialEntries={["/trip/1"]}>
                <Routes>
                    <Route path="/trip/:tripId" element={<TripDaysPage />} />
                </Routes>
            </MemoryRouter>
        );

        // ensure no clone button is shown
        await waitFor(() => {
            expect(screen.queryByText("Clone Trip")).toBeNull();
        }, { timeout: 5000 });
    });
});