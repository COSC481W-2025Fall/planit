import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB
vi.mock('../config/db.js', () => {
    const sql = vi.fn(async () => []);
    sql.transaction = vi.fn(async () => [ [], [] ]);
    sql.query = vi.fn(async () => ({ rows: [] }));
    return { sql };
});

// Mock Auth and Middleware
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

// Import the router to be tested
import tripRouter from '../routes/daysRoutes.js';
import { sql } from '../config/db.js';

// Helper to build app with different user states
const buildApp = ({ injectUser, undefinedUserId } = {}) => {
    const app = express();
    app.use(express.json());

    // Middleware to inject user if needed
    if (injectUser) {
        app.use((req, _res, next) => {
            req.user = { user_id: undefinedUserId ? undefined : 123 };
            next();
        });
    }

    // Mount the router
    app.use("/trip", tripRouter);
    return app;
};

// Different app states
const appWithUser = () => buildApp({ injectUser: true });
const appNoUser = () => buildApp();
const appWithUndefinedUserId = () => buildApp({ injectUser: true, undefinedUserId: true });

const mockOwnedTrip = (tripId = 1, userId = 123) => {
    sql.mockResolvedValueOnce([{ trips_id: tripId, user_id: userId }]);
};

// Clear mocks before each test
describe("Days Controller Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    //Tests for Creating a Day
    describe("POST /trip/trips/:tripId/days", () => {
        // Successful creation of a day
        it("should create a day for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            const created = { days_id: 10, trip_id: 1, day_date: '2025-10-01' };
            sql.transaction.mockResolvedValueOnce([ [], [created] ]);

            const res = await request(app)
                .post("/trip/trips/1/days")
                .send({ day_date: '2025-10-01' });

            expect(res.status).toBe(201);
            expect(res.body).toEqual(created);
            // One for trip check, one for insert
            expect(sql).toHaveBeenCalledTimes(1);
            expect(sql.transaction).toHaveBeenCalled(1);
        });

        // Creating a day without providing day_date
        it("should return 400 if day_date is missing", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);

            const res = await request(app).post("/trip/trips/1/days").send({});

            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: "A valid day_date is required." });
            expect(sql.transaction).not.toHaveBeenCalled(); 
        });

        // Unauthorized when user is not logged in
        it("should return 401 if user is not logged in", async () => {
            const app = appNoUser();
            const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
            expect(sql.transaction).not.toHaveBeenCalled();
        });

        // Trip not found or not owned
        it("should return 404 when trip is not found or not owned", async () => {
            const app = appWithUser();
            // No trip found
            sql.mockResolvedValueOnce([]); 
            const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found or access denied" });
            // Only the trip check
            expect(sql).toHaveBeenCalledTimes(1);
            expect(sql.transaction).not.toHaveBeenCalled();
        });

        // Database error handling
        it("should return 500 when DB error occurs", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            sql.transaction.mockRejectedValueOnce(new Error("DB Error"));
            const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(1);
            expect(sql.transaction).toHaveBeenCalledTimes(1);
        });

        //test to make sure the dates are being shifted on day creation
        it("should call the correct SQL to shift dates on create", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            const sentDate = '2025-10-10';

            sql.transaction.mockImplementationOnce(async (callback) => {
                sql.mockResolvedValueOnce([]);
                sql.mockResolvedValueOnce([{ day_id: 10 }]);
                return callback();
            });

            await request(app)
                .post("/trip/trips/1/days")
                .send({ day_date: sentDate });
            
            expect(sql).toHaveBeenCalledTimes(3);
            
            const updateSqlCall = sql.mock.calls[1];
            expect(updateSqlCall[0][0]).toContain("UPDATE days");
            expect(updateSqlCall[0][0]).toContain("day_date = day_date + INTERVAL '1 day'");
            expect(updateSqlCall[0][1]).toContain("AND day_date >=");
            expect(updateSqlCall[2]).toBe(sentDate);
        });
    });

    //Tests for Updating a Day
    describe("PUT /trip/trips/:tripId/days/:id", () => {
        // Successful update of a day
        it("should update a day for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            const updated = [{ days_id: 7, trip_id: 1, day_date: '2025-10-02' }];
            sql.mockResolvedValueOnce(updated);

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updated[0]);
            expect(sql).toHaveBeenCalledTimes(2);
        });

        // Changing a previously set day_date to a new value
        it("should change a previously set day_date to a new value", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            const updated = [{ days_id: 7, trip_id: 1, day_date: '2025-03-11' }];
            sql.mockResolvedValueOnce(updated);

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-03-11' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updated[0]);
            expect(sql).toHaveBeenCalledTimes(2);
        });

        // Day not found
        it("should return 404 when day does not exist", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            // No day found
            sql.mockResolvedValueOnce([]); 

            const res = await request(app).put("/trip/trips/1/days/999").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Day not found" });
            expect(sql).toHaveBeenCalledTimes(2);
        });

        // Unauthorized when user is not logged in
        it("should return 401 when user is not logged in", async () => {
            const app = appNoUser();

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });

        // Trip not found or not owned
        it("should return 404 when trip is not found or not owned", async () => {
            const app = appWithUser();
            sql.mockResolvedValueOnce([]);

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found or access denied" });
            expect(sql).toHaveBeenCalledTimes(1);
        });

        // Database error handling
        it("should return 500 when DB error occurs", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            sql.mockRejectedValueOnce(new Error("DB Error"));

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(2);
        });
    });

    //Tests for Reading all Days of a Trip
    describe("GET /trip/trips/:tripId/days", () => {
        // Successful retrieval of days
        it("should get all days for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            const days = [
                { days_id: 1, trip_id: 1, day_date: '2025-10-01' },
                { days_id: 2, trip_id: 1, day_date: '2025-10-02' }
            ];
            sql.mockResolvedValueOnce(days);

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(200);
            expect(res.body).toEqual(days);
            expect(sql).toHaveBeenCalledTimes(2);
        });

        // Unauthorized when user is not logged in
        it("should return 401 when user is not logged in", async () => {
            const app = appNoUser();

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });

        // Trip not found or not owned
        it("should return 404 when trip is not found or not owned", async () => {
            const app = appWithUser();
            sql.mockResolvedValueOnce([]);

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found or access denied" });
            expect(sql).toHaveBeenCalledTimes(1);
        });

        // Database error handling
        it("should return 500 when DB error occurs", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            sql.mockRejectedValueOnce(new Error("DB Error"));

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(2);
        });
    });

    //Tests for Deleting a Day from a Trip
    describe("DELETE /trip/trips/:tripId/days/:id", () => {
        // Successful deletion of a day
        it("should delete a day for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            // Mock day exists
            sql.mockResolvedValueOnce([{ days_id: 5 }]);

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(204);
            expect(res.text).toBe('');
            expect(sql).toHaveBeenCalledTimes(3); 
        });

        // Day not found
        it("should return 404 when day does not exist", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            // No day found
            sql.mockResolvedValueOnce([]); 

            const res = await request(app).delete("/trip/trips/1/days/999");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Day not found" });
            expect(sql).toHaveBeenCalledTimes(2);
        });

        // Unauthorized when user is not logged in
        it("should return 401 when user is not logged in", async () => {
            const app = appNoUser();

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });

        // Trip not found or not owned
        it("should return 404 when trip is not found or not owned", async () => {
            const app = appWithUser();
            // No trip found
            sql.mockResolvedValueOnce([]);

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found or access denied" });
            expect(sql).toHaveBeenCalledTimes(1);
        });

        // Database error handling
        it("should return 500 when DB error occurs", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            sql.mockRejectedValueOnce(new Error("DB Error"));

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(2);
        });

        //test to make sure deleting a day shifts dates
        it("should call the correct SQL to shift dates on delete", async () => {
            const app = appWithUser();
            const deletedDate = '2025-10-10';
            
            mockOwnedTrip(1);
            sql.mockResolvedValueOnce([{ day_date: deletedDate }]);
            
            sql.transaction.mockImplementationOnce(async (callback) => {
                sql.mockResolvedValueOnce([]);
                sql.mockResolvedValueOnce([]);
                return callback();
            });

            await request(app).delete("/trip/trips/1/days/5");
            
            expect(sql).toHaveBeenCalledTimes(4);
            
            const updateSqlCall = sql.mock.calls[3];
            expect(updateSqlCall[0][0]).toContain("UPDATE days");
            expect(updateSqlCall[0][0]).toContain("day_date = day_date - INTERVAL '1 day'");
            expect(updateSqlCall[0][1]).toContain("AND day_date >");
            expect(updateSqlCall[2]).toBe(deletedDate);
        });
    });

    //Tests for Unauthorized when user_id is undefined
    describe("Auth Edge Cases with undefined user_id", () => {
        // Creating a day with undefined user_id
        it("should return 401 for creating a day when user_id is undefined", async () => {
            const app = appWithUndefinedUserId();

            const res = await request(app).post("/trip/trips/1/days");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });
    });
});

