import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {makeApp, makeAppUndefinedUserId} from "./appFactory.js";
import { sql } from "../config/db.js";
import { generateDateRange } from "../controllers/tripController.js";
import * as db from '../config/db.js';
import * as socket from "../socket.js";

// Mock IO instance
vi.mock("../socket.js", () => ({
    io: {
        to: vi.fn(() => ({
            emit: vi.fn()
        }))
    }
}));

vi.mock("../config/db.js", () => {
    const sql = vi.fn(async () => []);

    sql.query = vi.fn(async () => ({ rows: [] }));

    sql.transaction = vi.fn(async (callback) => {
        // record the callback but still run it
        if (callback) {
            return await callback(sql);
        }
    });

    return { sql };
});

describe("Trip Controller Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetAllMocks();
        vi.restoreAllMocks();
        vi.useRealTimers();

        // ensure sql always resolves after reset
        sql.mockImplementation(async () => []);
        sql.transaction.mockImplementation(async (cb) => cb());
    });


    // DELETE TRIP TESTING
    describe("delete/ testing", () => {
        it("user is logged-in and trip is deleted returns 200", async () => {
            const app = makeApp({ injectUser: true });
            sql.mockResolvedValueOnce([
                { trips_id: 10, user_id: 123, trip_name: "Test Trip 1" }
            ]);
            sql.mockResolvedValueOnce([
                { trips_id: 10, user_id: 123, trip_name: "Test Trip 1" }
            ]);

            const res = await request(app).delete("/trip/delete").send({
                trips_id: 10
            });

            expect(res.body).toEqual("Trip deleted.");
            expect(res.status).toBe(200);
        });

        it("user is logged-in but no user_id defined returns 400", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true });
            const res = await request(app).delete("/trip/delete").send({});
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: "userId and trips_id are required, delete unsuccessful" });
        });

        it("user is not logged-in returns 401", async () => {
            const app = makeApp({ injectUser: false });
            const res = await request(app).delete("/trip/delete").send({});
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });

        it("user is logged-in and trip is not found returns 404 ", async () => {
            const app = makeApp({ injectUser: true });
            sql
              .mockResolvedValueOnce([])
              .mockResolvedValueOnce([]);

            const res = await request(app).delete("/trip/delete").send({ trips_id: "123"})
            expect(res.body).toEqual({error: "Trip not found, delete unsuccessful"});
            expect(res.status).toBe(404);
        });
    })


    // CREATE TRIP TESTING
    describe("create/ testing", () => {
        it("user logged-in returns 200 and trip created", async () => {
            const app = makeApp({ injectUser: true });

            const newTrip = {
                trips_id: 1,
                trip_name: "Test Trip",
                user_id: 123,
                trip_start_date: "2022-01-01",
                trip_location: "Test Location",
                is_private: false,
                image_id: null
            };

            sql.mockResolvedValueOnce([newTrip])

            const res = await request(app).post("/trip/create").send({
                tripName: "Test Trip",
                tripStartDate: "2022-01-01",
                tripEndDate: "2022-01-02"
            })
            expect(res.body).toEqual(newTrip);
            expect(res.status).toBe(200);
        });

        it("user is logged-in but no userId defined returns 400", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true });
            const res = await request(app).post("/trip/create").send({
                trip_name: "Test Trip",
                start_date: "2022-01-01",
            })
            expect(res.body).toEqual({error: "userId is required, creation unsuccessful" });
            expect(res.status).toBe(400);
        });

        it("user is not logged-in returns 401", async () => {
            const app = makeApp({ injectUser: false });
            const res = await request(app).post("/trip/create");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });

        it("adding a multi-day trip creates the correct number of days", async () => {
            const app = makeApp({ injectUser: true });
            const startDate = "2026-01-01";
            const endDate = "2026-01-05";
            const expectedDayCount = 5;

            const newTrip = {
                trips_id: 999,
                trip_name: "Day Count Test",
                user_id: 123,
                trip_start_date: startDate,
                trip_location: "Test Location",
                is_private: false,
                image_id: null
            };

            sql.mockResolvedValueOnce([newTrip]);
            sql.transaction.mockClear();

            const res = await request(app).post("/trip/create").send({
                tripName: newTrip.trip_name,
                tripStartDate: startDate,
                tripEndDate: endDate,
                tripLocation: newTrip.trip_location,
                isPrivate: newTrip.is_private,
                imageid: newTrip.image_id
            });

            const transactionCallback = sql.transaction.mock.calls[0][0];
            const dayQueries = transactionCallback(); 
            expect(dayQueries.length).toBe(expectedDayCount);
        });

        it("adding a single-day trip creates the correct number of days", async () => {
            const app = makeApp({ injectUser: true });
            const startDate = "2026-01-01";
            const endDate = "2026-01-01";
            const expectedDayCount = 1;

            const newTrip = {
                trips_id: 999,
                trip_name: "Day Count Test",
                user_id: 123,
                trip_start_date: startDate,
                trip_location: "Test Location",
                is_private: false,
                image_id: null
            };

            sql.mockResolvedValueOnce([newTrip]);
            sql.transaction.mockClear();

            const res = await request(app).post("/trip/create").send({
                tripName: newTrip.trip_name,
                tripStartDate: startDate,
                tripEndDate: endDate,
                tripLocation: newTrip.trip_location,
                isPrivate: newTrip.is_private,
                imageid: newTrip.image_id
            });

            const transactionCallback = sql.transaction.mock.calls[0][0];
            const dayQueries = transactionCallback(); 
            expect(dayQueries.length).toBe(expectedDayCount);
        });
    })


    // UPDATE TRIP TESTING
    describe("update/ testing", () => {
        it("user is logged-in and trip is updated successfully returns 200", async () => {
            sql.mockResolvedValueOnce([
                { trips_id: 10, user_id: 123, trip_start_date: "2022-01-01" }
            ]);
            const app = makeApp({ injectUser: true });
            const res = await request(app).put("/trip/update").send({
                trips_id: 10,
                tripName: "Test Trip 1.1",
            })
            expect(res.body).toEqual("Trip updated.");
            expect(res.status).toBe(200);
        });

        it("user logged-in but no valid fields supplied to update returns 400", async () => {
            sql.mockResolvedValueOnce([
                { trips_id: 10, user_id: 123, trip_start_date: "2022-01-01" }
            ]);
            const app = makeApp({ injectUser: true });
            const res = await request(app).put("/trip/update").send({
                trips_id: 10,
                tripname: "Test Trip 1.1",
            })
            expect(res.body).toEqual({error: "No valid fields were supplied for update." });
            expect(res.status).toBe(400);
        });

        it("user is logged-in but no userId is defined returns 400", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true });
            const res = await request(app).put("/trip/update").send({
                tripName: "Test Trip",
                start_date: "2022-01-01",
            });
            expect(res.body).toEqual({ error: "userId and trips_id are required, update unsuccessful" });
            expect(res.status).toBe(400);
        });

        it("user is not logged-in returns 401", async () => {
            const app = makeApp({ injectUser: false });
            const res = await request(app).put("/trip/update");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });

        it("user is logged-in and trip not found returns 404", async () => {
            sql.mockResolvedValueOnce([]);
            const app = makeApp({ injectUser: true });
            const res = await request(app).put("/trip/update").send({
                trips_id: 12,
                tripName: "Test Trip 1.1",
            })
            expect(res.body).toEqual({ error: "Trip not found, update unsuccessful" });
            expect(res.status).toBe(404);
        });
    })


    // READ TRIP TESTING
    describe("read/ testing", () => {

        describe("read/trip_id testing", () => {
            it("user is logged-in returns 200 and single trip", async () => {
                const app = makeApp({ injectUser: true });

                sql.mockResolvedValueOnce([
                    { trips_id: 10, user_id: 123, trip_name: "Test Trip" },
                ]);
                sql.mockResolvedValueOnce([]);

                const res = await request(app).get("/trip/read/10");
                expect(res.status).toBe(200);
                expect(res.body).toEqual({
                    trips_id: 10,
                    user_id: 123,
                    trip_name: "Test Trip",
                    user_role: "owner"
                });
            });

            it("user is not logged-in returns 401", async () => {
                const app = makeApp({ injectUser: false });
                const res = await request(app).get("/trip/read/8");
                expect(res.status).toBe(401);
                expect(res.body).toEqual({ loggedIn: false });
            });

            it("user is logged-in and no trip found returns 404", async () => {
                const app = makeApp({ injectUser: true });

                sql.mockResolvedValueOnce([]);

                const res = await request(app).get("/trip/read/8");
                expect(res.status).toBe(404);
                expect(res.body).toEqual({
                    error: "Trip not found, read unsuccessful"
                });
            });
        })


        // FETCH ALL TRIPS TESTING
        describe("fetchAllTrips testing", () => {
            it("user is logged-in returns 200 and trips", async () => {
                const app = makeApp({ injectUser: true });

                sql.mockResolvedValueOnce([
                    { trips_id: 10, user_id: 123, trip_name: "Test Trip 1" },
                    { trips_id: 11, user_id: 123, trip_name: "Test Trip 2" },
                ]);

                const res = await request(app).get("/trip/readAll");
                expect(res.status).toBe(200);
                expect(res.body).toEqual({
                    loggedIn: true,
                    trips: [{ trips_id: 10, user_id: 123, trip_name: "Test Trip 1" },
                        { trips_id: 11, user_id: 123, trip_name: "Test Trip 2" }],
                });
            });

            it("user is logged-in with no trips created returns 200", async () => {
                const app = makeApp({ injectUser: true });

                sql.mockResolvedValueOnce([]);

                const res = await request(app).get("/trip/readAll");
                expect(res.status).toBe(200);
                expect(res.body).toEqual({
                    loggedIn: true,
                    trips: [],
                });
            });

            it("user is not logged in returns 401", async () => {
                const app = makeApp({ injectUser: false });
                const res = await request(app).get("/trip/readAll");
                expect(res.status).toBe(401);
                expect(res.body).toEqual({ loggedIn: false });
            });
        })

        describe("generate date range tests", () => {
            it("returns a list of dates", () => {
                const startDate = "2025-10-25";
                const endDate = "2025-10-29";
                const expectedDates = ["2025-10-25", "2025-10-26", "2025-10-27", "2025-10-28", "2025-10-29"];
                expect(generateDateRange(startDate, endDate)).toEqual(expectedDates);
            });

            it("returns a single date for a one date range", () => {
                const startDate = "2025-11-01";
                const endDate = "2025-11-01";
                const expectedDates = ["2025-11-01"];
                expect(generateDateRange(startDate, endDate)).toEqual(expectedDates);
            });

            it("handles dates crossing a month boundary", () => {
                const startDate = "2025-10-30";
                const endDate = "2025-11-02";
                const expectedDates = ["2025-10-30", "2025-10-31", "2025-11-01", "2025-11-02"];
                expect(generateDateRange(startDate, endDate)).toEqual(expectedDates);
            });

            it("handles dates crossing a year boundary", () => {
                const startDate = "2025-12-30";
                const endDate = "2026-01-01";
                const expectedDates = ["2025-12-30", "2025-12-31", "2026-01-01"];
                expect(generateDateRange(startDate, endDate)).toEqual(expectedDates);
            });
        })
    })

    //Test getting the owner of a trip
    describe("getOwnerForTrip testing", () => {
        //check that the correct owner is returned for a trip
        it("returns the owner if trip exists", async () => {
            const app = makeApp({ injectUser: true });
            const tripId = 10;

            const mockOwner = {
                user_id: 123,
                username: "olivia",
                photo: "pretend_photo_url"
            };

            sql.mockResolvedValueOnce([mockOwner]);

            const res = await request(app).get(`/trip/owner/${tripId}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ owner: mockOwner });
        });

        //check if no owner is found for a non-existent trip
        it("returns owner as null if trip does not exist", async () => {
            const app = makeApp({ injectUser: true });
            const tripId = 999;

            sql.mockResolvedValueOnce([]); // No owner found

            const res = await request(app).get(`/trip/owner/${tripId}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ owner: null });
        });

        //check that a 500 error is returned if there is a database error
        it("returns 500 if there is a database error", async () => {
            const app = makeApp({ injectUser: true });
            const tripId = 10;

            const mockError = new Error("DB Error");
            sql.mockRejectedValueOnce(mockError);

            const res = await request(app).get(`/trip/owner/${tripId}`);

            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
        });
    })
});
