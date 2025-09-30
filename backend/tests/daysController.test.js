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

});

   