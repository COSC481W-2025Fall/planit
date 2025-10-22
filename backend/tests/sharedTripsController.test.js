import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

//Mock DB
vi.mock('../config/db.js', () => {
    const sql = vi.fn(async () => []);
    sql.query = vi.fn(async () => ({ rows: [] }));
    return { sql };
});

//Mock Auth and Middleware
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

vi.mock("../middleware/loadSharedTrip.js", () => {
    return {
        loadSharedTrip: async (req, res, next) => {
            try {
                const { sql } = await import("../config/db.js");
                const rows = await sql();
                if (rows && rows.length > 0) {
                    req.sharedTrip = { trips_id: Number(req.params.tripId), user_id: req.user?.user_id };
                    return next();
                }
                return res.status(404).json({ error: 'Shared trip not found or access denied' });
            } catch (e) {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        },
    };
});

//Import the router to be tested
import sharedTripsRouter from '../routes/sharedTrips.js';
import { sql } from '../config/db.js';

//Helper app setup
const buildApp = ({ injectUser, undefinedUserId } = {}) => {
    const app = express();
    app.use(express.json());

    //Middleware to inject user if needed
    if (injectUser) {
        app.use((req, _res, next) => {
            req.user = { user_id: undefinedUserId ? undefined : 123 };
            next();
        });
    }
    
    app.use("/shared", sharedTripsRouter);
    return app;
};

//Different app states
const appWithUser = () => buildApp({ injectUser: true });
const appWithoutUser = () => buildApp();
const appWithUndefinedUserId = () => buildApp({ injectUser: true, undefinedUserId: true });

//Clear mocks before each test
describe("Shared Trips Controller Unit Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    //Tests for getting all trips shared with the user
    describe("GET /shared/readAllSharedTrips", () => {
        it("should return 401 if user is not logged in", async () => {
            const app = appWithoutUser();
            const res = await request(app).get("/shared/readAllSharedTrips");
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });
        it("should return 200 and an array of shared trips if user is logged in", async () => {
            const app = appWithUser();
            const sharedTrips = [
                { trip_id: 1, user_id: 123 },
                { trip_id: 2, user_id: 123 },
            ];
            sql.mockResolvedValueOnce(sharedTrips);

            const res = await request(app).get("/shared/readAllSharedTrips");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ sharedTrips });
            expect(sql).toHaveBeenCalledTimes(1);
        });
        it("should return 500 if there is a database error", async () => {
            const app = appWithUser();
            sql.mockRejectedValueOnce(new Error("DB Error"));

            const res = await request(app).get("/shared/readAllSharedTrips");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(1);
        });
    });

    //Tests for adding a participant to a trip
    
});
