// backend/tests/tripController.supertest.test.js
import request from "supertest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {makeApp, makeAppUndefinedUserId} from "./appFactory.js";
import { sql } from "../config/db.js";

// Mock DB
vi.mock("../config/db.js", () => {
    const sql = vi.fn(async () => []);
    sql.query = vi.fn(async () => ({ rows: [] }));
    return { sql };
});

describe("Trip Controller Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetAllMocks();
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    // DELETE TRIP TESTING
    describe("delete/ testing", () => {
        it("user is logged-in and trip is deleted returns 200", async () => {
            const app = makeApp({ injectUser: true }); // no injectUser
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
            const app = makeAppUndefinedUserId({ injectUser: true }); // no injectUser
            const res = await request(app).delete("/trip/delete").send({
            });
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: "userId is required, delete unsuccessful" });
        });

        it("user is not logged-in returns 401", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).delete("/trip/delete").send({
            });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });

        it("user is logged-in and trip is not found returns 404 ", async () => {
            const app = makeApp({ injectUser: true }); // no injectUser
            const res = await request(app).delete("/trip/delete").send({
            })
            expect(res.body).toEqual({error: "Trip not found, delete unsuccessful"});
            expect(res.status).toBe(404);
        });
    })


    // CREATE TRIP TESTING
    describe("create/ testing", () => {
        it("user logged-in returns 200 and trip created", async () => {
            const app = makeApp({ injectUser: true }); // no injectUser
            const res = await request(app).post("/trip/create").send({
                trip_name: "Test Trip",
                start_date: "2022-01-01",
            })
            expect(res.body).toEqual("Trip created.");
            expect(res.status).toBe(200);
        });

        it("user is logged-in but no userId defined returns 400", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true }); // no injectUser
            const res = await request(app).post("/trip/create").send({
                trip_name: "Test Trip",
                start_date: "2022-01-01",
            })
            expect(res.body).toEqual({error: "userId is required, creation unsuccessful" });
            expect(res.status).toBe(400);
        });

        it("user is not logged-in returns 401", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).post("/trip/create");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });
    })


    // UPDATE TRIP TESTING
    describe("update/ testing", () => {
        it("user is logged-in and trip is updated successfully returns 200", async () => {
            sql.mockResolvedValueOnce([
                { trips_id: 10, user_id: 123, trip_name: "Test Trip 1" }
            ]);
            const app = makeApp({ injectUser: true }); // no injectUser
            const res = await request(app).put("/trip/update").send({
                trips_id: 10,
                tripName: "Test Trip 1.1",
            })
            expect(res.body).toEqual("Trip updated.");
            expect(res.status).toBe(200);
        });

        it("user logged-in but no fields supplied to update returns 400", async () => {
            sql.mockResolvedValueOnce([
                { trips_id: 10, user_id: 123, trip_name: "Test Trip 1" }
            ]);
            const app = makeApp({ injectUser: true }); // no injectUser
            const res = await request(app).put("/trip/update").send({
                trips_id: 10,
                tripname: "Test Trip 1.1",
            })
            // tripname is not a recognized field and the call wil fail.
            expect(res.body).toEqual({error: "No fields to update, update unsuccessful" });
            expect(res.status).toBe(400);
        });

        it("user is logged-in but no userId is defined returns 400", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true }); // no injectUser
            const res = await request(app).put("/trip/update").send({
                tripName: "Test Trip",
                start_date: "2022-01-01",
            });
            expect(res.body).toEqual({ error: "userId and trips_id are required, update unsuccessful" });
            expect(res.status).toBe(400);
        });

        it("user is not logged-in returns 401", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).put("/trip/update");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });


        it("user is logged-in and trip not found returns 404", async () => {
            sql.mockResolvedValueOnce([
                // { trips_id: 10, user_id: 123, trip_name: "Test Trip 1" }
            ]);
            const app = makeApp({ injectUser: true }); // no injectUser
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

                const res = await request(app).get("/trip/read/10");
                expect(res.status).toBe(200);
                expect(res.body).toEqual(
                    { trips_id: 10, user_id: 123, trip_name: "Test Trip" }
                );
            });

            it("user is not logged-in returns 401", async () => {
                const app = makeApp({ injectUser: false }); // no injectUser
                const res = await request(app).get("/trip/read/8");
                expect(res.status).toBe(401);
                expect(res.body).toEqual({ loggedIn: false });
            });

            it("user is logged-in and no trip found returns 404", async () => {
                const app = makeApp({ injectUser: true });

                sql.mockResolvedValueOnce([
                ]);

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

                sql.mockResolvedValueOnce([
                ]);

                const res = await request(app).get("/trip/readAll");
                expect(res.status).toBe(200);
                expect(res.body).toEqual({
                    loggedIn: true,
                    trips: [],
                });
            });

            it("user is not logged in returns 401", async () => {
                const app = makeApp({ injectUser: false }); // no injectUser
                const res = await request(app).get("/trip/readAll");
                expect(res.status).toBe(401);
                expect(res.body).toEqual({ loggedIn: false });
            });
        })
    })
});