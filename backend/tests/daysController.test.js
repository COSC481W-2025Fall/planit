import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB
vi.mock('../config/db.js', () => {
    const sql = vi.fn(async () => []);
    sql.transaction = vi.fn(async (callback) => {
        return await callback();
    });
    sql.query = vi.fn(async () => ({ rows: [] }));
    return { sql };
});

// Mock Auth
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

// Mock the new loadTripPermissions middleware
vi.mock("../middleware/loadTripPermissions.js", () => {
    return {
        loadTripPermissions: async (req, res, next) => {
            try {
                const { sql } = await import("../config/db.js");
                
                // Get the trip
                const tripId = Number(req.params.tripId);
                const userId = req.user?.user_id;
                
                const trips = await sql();
                
                if (!trips || trips.length === 0) {
                    return res.status(404).json({ error: 'Trip not found' });
                }
                
                const trip = trips[0];
                
                // Check if owner
                const isOwner = trip.user_id === userId;
                
                // Check shared access - make second call
                const sharedResult = await sql();
                const hasSharedAccess = sharedResult && sharedResult.length > 0;
                
                // Determine permission
                let permission = null;
                if (isOwner) {
                    permission = "owner";
                } else if (hasSharedAccess) {
                    permission = "participant";
                } else if (!trip.is_private) {
                    permission = "viewer";
                }
                
                if (!permission) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                
                // Only allow modifications for owner and participant
                if (req.method !== 'GET' && permission === "viewer") {
                    return res.status(403).json({ error: "You don't have permission to modify this trip" });
                }
                
                req.trip = trip;
                req.tripPermission = permission;
                next();
            } catch (e) {
                console.error(e);
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

// Mock a trip owned by the user
const mockOwnedTrip = (tripId = 1, userId = 123, isPrivate = false) => {
    // First call: trip fetch
    sql.mockResolvedValueOnce([{ trips_id: tripId, user_id: userId, is_private: isPrivate }]);
    // Second call: shared access check (empty = not shared)
    sql.mockResolvedValueOnce([]);
};

// Mock a shared trip (user is participant)
const mockSharedTrip = (tripId = 1, userId = 123, ownerId = 999) => {
    // First call: trip fetch (owned by someone else)
    sql.mockResolvedValueOnce([{ trips_id: tripId, user_id: ownerId, is_private: false }]);
    // Second call: shared access check (has access)
    sql.mockResolvedValueOnce([{ trip_id: tripId, user_id: userId }]);
};

// Mock a public trip (user is viewer)
const mockPublicTrip = (tripId = 1, ownerId = 999) => {
    // First call: trip fetch (owned by someone else, public)
    sql.mockResolvedValueOnce([{ trips_id: tripId, user_id: ownerId, is_private: false }]);
    // Second call: shared access check (no access)
    sql.mockResolvedValueOnce([]);
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
            
            const created = { day_id: 10, trip_id: 1, day_date: '2025-10-01' };
            sql.transaction.mockResolvedValueOnce([[created]]);

            const res = await request(app)
                .post("/trip/trips/1/days")
                .send({ day_date: '2025-10-01' });

            expect(res.status).toBe(201);
            expect(sql.transaction).toHaveBeenCalled();
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
        });

        // Trip not found
        it("should return 404 when trip is not found", async () => {
            const app = appWithUser();
            // No trip found
            sql.mockResolvedValueOnce([]); 
            
            const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found" });
            expect(sql).toHaveBeenCalledTimes(1);
        });

        // Viewer cannot create days
        it("should return 403 when user is only a viewer", async () => {
            const app = appWithUser();
            mockPublicTrip(1);
            
            const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "You don't have permission to modify this trip" });
        });

        // Participant can create days
        it("should allow participant to create a day", async () => {
            const app = appWithUser();
            mockSharedTrip(1);
            
            const created = { day_id: 10, trip_id: 1, day_date: '2025-10-01' };
            sql.transaction.mockResolvedValueOnce([[created]]);

            const res = await request(app)
                .post("/trip/trips/1/days")
                .send({ day_date: '2025-10-01' });

            expect(res.status).toBe(201);
        });

        // Database error handling
        it("should return 500 when DB error occurs", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            sql.transaction.mockRejectedValueOnce(new Error("DB Error"));
            
            const res = await request(app).post("/trip/trips/1/days").send({ day_date: '2025-10-01' });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
        });
    });

    //Tests for Updating a Day
    describe("PUT /trip/trips/:tripId/days/:id", () => {
        // Successful update of a day
        it("should update a day for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            
            const updated = [{ day_id: 7, trip_id: 1, day_date: '2025-10-02' }];
            sql.mockResolvedValueOnce(updated);

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(200);
            expect(res.body).toEqual(updated[0]);
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
        });

        // Viewer cannot update days
        it("should return 403 when user is only a viewer", async () => {
            const app = appWithUser();
            mockPublicTrip(1);

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "You don't have permission to modify this trip" });
        });

        // Unauthorized when user is not logged in
        it("should return 401 when user is not logged in", async () => {
            const app = appNoUser();

            const res = await request(app).put("/trip/trips/1/days/7").send({ day_date: '2025-10-02' });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
        });
    });

    //Tests for Reading all Days of a Trip
    describe("GET /trip/trips/:tripId/days", () => {
        // Successful retrieval of days
        it("should get all days for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            
            const days = [
                { day_id: 1, trip_id: 1, day_date: '2025-10-01' },
                { day_id: 2, trip_id: 1, day_date: '2025-10-02' }
            ];
            sql.mockResolvedValueOnce(days);

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(200);
            expect(res.body).toEqual(days);
        });

        // Viewer can read days
        it("should allow viewer to read days", async () => {
            const app = appWithUser();
            mockPublicTrip(1);
            
            const days = [{ day_id: 1, trip_id: 1, day_date: '2025-10-01' }];
            sql.mockResolvedValueOnce(days);

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(200);
            expect(res.body).toEqual(days);
        });

        // Unauthorized when user is not logged in
        it("should return 401 when user is not logged in", async () => {
            const app = appNoUser();

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
        });

        // Trip not found
        it("should return 404 when trip is not found", async () => {
            const app = appWithUser();
            sql.mockResolvedValueOnce([]);

            const res = await request(app).get("/trip/trips/1/days");
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found" });
        });
    });

    //Tests for Deleting a Day from a Trip
    describe("DELETE /trip/trips/:tripId/days/:id", () => {
        // Successful deletion of a day
        it("should delete a day for an owned trip", async () => {
            const app = appWithUser();
            mockOwnedTrip(1);
            
            // Mock day exists
            sql.mockResolvedValueOnce([{ day_id: 5, day_date: '2025-10-10' }]);
            sql.transaction.mockResolvedValueOnce([[], []]);

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(204);
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
        });

        // Viewer cannot delete days
        it("should return 403 when user is only a viewer", async () => {
            const app = appWithUser();
            mockPublicTrip(1);

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "You don't have permission to modify this trip" });
        });

        // Unauthorized when user is not logged in
        it("should return 401 when user is not logged in", async () => {
            const app = appNoUser();

            const res = await request(app).delete("/trip/trips/1/days/5");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
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