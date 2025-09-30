import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB
vi.mock('../config/db.js', () => {
    const sql = vi.fn(async () => []);
    sql.query = vi.fn(async () => ({ rows: [] }));
    return { sql };
});

vi.mock("../auth.js", () => {
    return {
        isLoggedIn: (req, res, next) => {
            if (!req.user || req.user.user_id === undefined || req.user.user_id === null) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            return next();
        },
    };
});

vi.mock("../middleware/loadOwnedTrip.js", () => {
    return {
        loadOwnedTrip: async (req, res, next) => {
            try {
                const { sql } = await import("../config/db.js");
                const rows = await sql();
                if (rows && rows.length > 0) {
                    req.trip = { trips_id: Number(req.params.tripId), user_id: req.user?.user_id };
                    return next();
                }
                return res.status(404).json({ error: 'Trip not found or access denied' });
            } catch (e) {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        },
    };
});

import tripRouter from '../routes/daysRoutes.js';
import { sql } from '../config/db.js';

const buildApp = ({ injectUser, undefinedUserId } = {}) => {
    const app = express();
    app.use(express.json());

    if (injectUser) {
        app.use((req, _res, next) => {
            req.user = { user_id: undefinedUserId ? undefined : 123 }; // change per test if needed
            next();
        });
    }

    app.use("/trip", tripRouter);
    return app;
};

    const appWithUser = () => buildApp({ injectUser: true });
    const appNoUser = () => buildApp();
    const appWithUndefinedUserId = () => buildApp({ injectUser: true, undefinedUserId: true });

    const mockOwnedTrip = (tripId = 1, userId = 123) => {
        sql.mockResolvedValueOnce([{ trips_id: tripId, user_id: userId }]);
    };

describe("Days Controller Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

     //Tests for Creating a Day
        describe("POST /trip/trips/:tripId/days", () => {
            it("should create a day for an owned trip", async () => {
                const app = appWithUser();
                mockOwnedTrip(1);
                const created = [{ days_id: 10, trip_id: 1, day_date: '2025-10-01' }];
                sql.mockResolvedValueOnce(created);
    
                const res = await request(app)
                    .post("/trip/trips/1/days")
                    .send({ day_date: '2025-10-01' });
                
                expect(res.status).toBe(201);
                expect(res.body).toEqual(created[0]);
                expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for insert
            });
    
            it("should create a day without day_date resulting in null day_date", async () => {
                const app = appWithUser();
                mockOwnedTrip(1);
                const created = [{ days_id: 11, trip_id: 1, day_date: null }];
                sql.mockResolvedValueOnce(created);
    
                const res = await request(app).post("/trip/trips/1/days").send({});
    
                expect(res.status).toBe(201);
                expect(res.body).toEqual(created[0]);
                expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for insert
            });
    
            it("should return 401 if user is not logged in", async () => {
                const app = appNoUser();
                const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
                expect(res.status).toBe(401);
                expect(res.body).toEqual({ error: "Unauthorized" });
                expect(sql).not.toHaveBeenCalled();
            });
    
            it("should return 404 when trip is not found or not owned", async () => {
                const app = appWithUser();
                sql.mockResolvedValueOnce([]); // No trip found
                const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
                expect(res.status).toBe(404);
                expect(res.body).toEqual({ error: "Trip not found or access denied" });
                expect(sql).toHaveBeenCalledTimes(1); // Only the trip check
            });
    
            it("should return 500 when DB error occurs", async () => {
                const app = appWithUser();
                mockOwnedTrip(1);
                sql.mockRejectedValueOnce(new Error("DB Error"));
                const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
                expect(res.status).toBe(500);
                expect(res.body).toEqual({ error: "Internal Server Error" });
                expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for insert
            });
        });

        //Tests for Updating a Day
            describe("PUT /trip/trips/:tripId/days/:id", () => {
                it("should update a day for an owned trip", async () => {
                    const app = appWithUser();
                    mockOwnedTrip(1);
                    const updated = [{ days_id: 7, trip_id: 1, day_date: '2025-10-02' }];
                    sql.mockResolvedValueOnce(updated);
        
                    const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
                    expect(res.status).toBe(200);
                    expect(res.body).toEqual(updated[0]);
                    expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for update
                });
        
                it("should change a previously set day_date to a new value", async () => {
                    const app = appWithUser();
                    mockOwnedTrip(1);
                    const updated = [{ days_id: 7, trip_id: 1, day_date: '2025-03-11' }];
                    sql.mockResolvedValueOnce(updated);
        
                    const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-03-11' });
                    expect(res.status).toBe(200);
                    expect(res.body).toEqual(updated[0]);
                    expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for update
                });
        
                it("should return 404 when day does not exist", async () => {
                    const app = appWithUser();
                    mockOwnedTrip(1);
                    sql.mockResolvedValueOnce([]); // No day found
        
                    const res = await request(app).put("/trip/trips/1/days/999").send({ day_date: '2025-10-02' });
                    expect(res.status).toBe(404);
                    expect(res.body).toEqual({ error: "Day not found" });
                    expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for update
                });
        
                it("should return 401 when user is not logged in", async () => {
                    const app = appNoUser();
        
                    const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
                    expect(res.status).toBe(401);
                    expect(res.body).toEqual({ error: "Unauthorized" });
                    expect(sql).not.toHaveBeenCalled();
                });
        
                it("should return 404 when trip is not found or not owned", async () => {
                    const app = appWithUser();
                    sql.mockResolvedValueOnce([]);
        
                    const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
                    expect(res.status).toBe(404);
                    expect(res.body).toEqual({ error: "Trip not found or access denied" });
                    expect(sql).toHaveBeenCalledTimes(1); // Only the trip check
                });
        
                it("should return 500 when DB error occurs", async () => {
                    const app = appWithUser();
                    mockOwnedTrip(1);
                    sql.mockRejectedValueOnce(new Error("DB Error"));
        
                    const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
                    expect(res.status).toBe(500);
                    expect(res.body).toEqual({ error: "Internal Server Error" });
                    expect(sql).toHaveBeenCalledTimes(2); // One for trip check, one for update
                });
            });
});

   