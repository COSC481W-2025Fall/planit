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
    beforeEach(() => vi.clearAllMocks());

    // DELETE TRIP TESTING
    describe("delete/ testing", () => {
        it("returns 200 when trip is deleted", async () => {
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

        it("returns 400 when user is logged in yet user_id is undefined", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true }); // no injectUser
            const res = await request(app).delete("/trip/delete").send({
            });
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: "userId is required, delete unsuccessful" });
        });

        it("returns 401 when user is not logged in.", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).delete("/trip/delete").send({
            });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });

        it("returns 404 when trip is not found", async () => {
            const app = makeApp({ injectUser: true }); // no injectUser
            const res = await request(app).delete("/trip/delete").send({
            })
            expect(res.body).toEqual({error: "Trip not found, delete unsuccessful"});
            expect(res.status).toBe(404);
        });
    })


    // CREATE TRIP TESTING
    describe("create/ testing", () => {
        it("returns 200 when user logged in", async () => {
            const app = makeApp({ injectUser: true }); // no injectUser
            const res = await request(app).post("/trip/create").send({
                trip_name: "Test Trip",
                days: 5,
                start_date: "2022-01-01",
            })
            // expect(res.status).toBe(401);
            expect(res.body).toEqual("Trip created.");
            expect(res.status).toBe(200);
        });

        it("returns 400 when user is logged in but no userId defined", async () => {
            const app = makeAppUndefinedUserId({ injectUser: true }); // no injectUser
            const res = await request(app).post("/trip/create").send({
                trip_name: "Test Trip",
                start_date: "2022-01-01",
            })
            expect(res.body).toEqual({error: "userId is required, creation unsuccessful" });
            expect(res.status).toBe(400);
        });

        it("returns 401 when user is not logged in", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).post("/trip/create");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });
    })


    // READ TRIP TESTING
    describe("Read/trip_id testing", () => {
        it("returns 200 and single trip for logged-in user", async () => {
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

        it("returns 401 when user is not logged in", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).get("/trip/read/8");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });

        it("returns 404 and nothing for logged-in user with no trips created", async () => {
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
        it("returns 200 and trips for logged-in user", async () => {
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

        it("returns 200 and nothing for logged-in user with no trips created", async () => {
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

        it("returns 401 when user is not logged in", async () => {
            const app = makeApp({ injectUser: false }); // no injectUser
            const res = await request(app).get("/trip/readAll");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ loggedIn: false });
        });
    })
});