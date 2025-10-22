import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

//Mock DB
vi.mock('../config/db.js', () => {
  const sql = vi.fn(async (strings, ...values) => {
    // global kill-switch to simulate DB failure on *this* call
    if (sql.__forceError) {
      // reset after one use if you want one-shot behavior; keep sticky otherwise
      sql.__forceError = false;
      throw new Error("DB Error");
    }
    const query = String(strings?.join?.(' ') ?? strings ?? '').toLowerCase();

    //List Participants
      if (query.includes('join shared') && query.includes('from users')) {
      return [
        { user_id: 1, username: 'adam' },
        { user_id: 2, username: 'chris' },
        { user_id: 3, username: 'hunter' },
      ];
    }

    // --- READ ALL SHARED TRIPS ---
    if (query.includes('from shared') && query.includes('where')) {
      const userId = values[0];
      return [
        { trip_id: 1, user_id: userId },
        { trip_id: 2, user_id: userId },
      ];
    }

    // --- USER LOOKUP ---
    if (query.includes('from users') && query.includes('where') && query.includes('username =')) {
      const username = values[0];
      if (username === 'nonexistentuser') return [];
      if (username === 'selfuser')
        return [{ user_id: 123, username: 'selfuser', email: 'self@example.com' }];
      return [{ user_id: 5, username, email: `${username}@example.com` }];
    }

    // --- INSERT PARTICIPANT ---
    if (query.includes('insert into shared')) {
      const [tripId, userId] = values;
      // simulate DB Error
      if (tripId === 1 && userId === 5 && sql.__forceError)
        throw new Error("DB Error");
      // simulate empty insert (already exists)
      if (tripId === 1 && userId === 123)
        return [];
      return [{ trip_id: tripId, user_id: userId }];
    }

    // --- TRIP LOOKUP for email ---
    if (query.includes('from trips') && query.includes('join users')) {
      return [{ title: 'Road Trip', owner_username: 'chris' }];
    }

    // --- DELETE PARTICIPANT ---
    if (query.includes('delete from shared')) {
      // simulate DB Error
      if (sql.__forceError) throw new Error("DB Error");
      return { count: 1 };
    }

    return [];
  });

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

vi.mock("../middleware/loadOwnedTrip.js", () => ({
  loadOwnedTrip: async (req, res, next) => {
    const id = Number(req.body?.tripId ?? req.params?.tripId ?? req.query?.tripId);
    // simulate "trip not found" path that the real middleware would take
    if (id === 999) {
      return res.status(404).json({ error: "Trip not found or access denied" });
    }
    req.trip = { trips_id: id || 1, user_id: req.user?.user_id };
    req.tripPermission = "owner";
    return next();
  },
}));

vi.mock("../middleware/loadEditableTrip.js", () => ({
  loadEditableTrip: async (req, res, next) => {
    const id = Number(req.query?.tripId ?? req.params?.tripId ?? req.body?.tripId);
    // simulate "no access" (Forbidden) case used in listParticipants test
    if (id === 999) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.trip = { trips_id: id || 1, user_id: req.user?.user_id };
    req.tripPermission = "shared";
    return next();
  },
}));

//Import nodemailer and mock sendMail
vi.mock("../utils/mailer.js", () => ({
  sendParticipantAddedEmail: vi.fn(async () => Promise.resolve()),
}));

//Import the router to be tested
import sharedTripsRouter from '../routes/sharedTripsRoutes.js';
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
        sql.__forceError = false;
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

            const res = await request(app).get("/shared/readAllSharedTrips");
            expect(res.status).toBe(200);
            expect(res.body).toEqual({
        sharedTrips: [
          { trip_id: 1, user_id: 123 },
          { trip_id: 2, user_id: 123 },
        ],
      });
      expect(sql).toHaveBeenCalledTimes(1); // the SELECT FROM shared
        });
        it("should return 500 if there is a database error", async () => {
            const app = appWithUser();
            sql.__forceError = true;

            const res = await request(app).get("/shared/readAllSharedTrips");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(1);
        });
    });

    //Tests for adding a participant to a trip
    describe("POST /shared/addParticipant", () => {
        it("should return 401 if user is not logged in", async () => {
            const app = appWithoutUser();
            const res = await request(app)
                .post("/shared/addParticipant")
                .send({ tripId: 1, username: "testuser" });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });
        it("should return 404 if trip is not found", async () => {
            const app = appWithUser();
            sql.mockResolvedValueOnce([]);
            const res = await request(app)
                .post("/shared/addParticipant")
                .send({ tripId: 999, username: "testuser" });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found or access denied" });
            expect(sql).toHaveBeenCalledTimes(0);
        });
        it("should return 404 if participant user is not found", async () => {
            const app = appWithUser();
            const res = await request(app)
                .post("/shared/addParticipant")
                .send({ tripId: 1, username: "nonexistentuser" });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "User not found" });
            expect(sql).toHaveBeenCalledTimes(1);
        });
        it("should return 400 if trying to add oneself as participant", async () => {
            const app = appWithUser();
            const res = await request(app)
                .post("/shared/addParticipant")
                .send({ tripId: 1, username: "selfuser" });
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: "Cannot add yourself as a participant" });
            expect(sql).toHaveBeenCalledTimes(1);
        });
        it("should return 200 if participant is added successfully", async () => {
            const app = appWithUser();
            const res = await request(app)
                .post("/shared/addParticipant")
                .send({ tripId: 1, username: "newuser" });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Participant added to shared trip." });
            expect(sql).toHaveBeenCalledTimes(3);
        });
        it("should return 500 if there is a database error", async () => {
            const app = appWithUser();
            sql.__forceError = true;
            const res = await request(app)
                .post("/shared/addParticipant")
                .send({ tripId: 1, username: "newuser" });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalled();
        });
    });


    //Tests for removing a participant from a trip
    describe("DELETE /shared/removeParticipant", () => {
        it("should return 401 if user is not logged in", async () => {
            const app = appWithoutUser();
            const res = await request(app)
                .delete("/shared/removeParticipant")
                .send({ tripId: 1, username: "testuser" });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });
        it("should return 404 if trip is not found", async () => {
            const app = appWithUser();
            const res = await request(app)
                .delete("/shared/removeParticipant")
                .send({ tripId: 999, username: "testuser" });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "Trip not found or access denied" });
            expect(sql).toHaveBeenCalledTimes(0);
        });
        it("should return 404 if participant user is not found", async () => {
            const app = appWithUser();
        
            const res = await request(app)
                .delete("/shared/removeParticipant")
                .send({ tripId: 1, username: "nonexistentuser" });
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: "User not found" });
            expect(sql).toHaveBeenCalledTimes(1);
        });
        it("should return 200 if participant is removed successfully", async () => {
            const app = appWithUser();
            const res = await request(app)
                .delete("/shared/removeParticipant")
                .send({ tripId: 1, username: "existinguser" });
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: "Participant removed from shared trip." });
            expect(sql).toHaveBeenCalledTimes(2);
        });
        it("should return 500 if there is a database error", async () => {
            const app = appWithUser();
            sql.__forceError = true;
            const res = await request(app)
                .delete("/shared/removeParticipant")
                .send({ tripId: 1, username: "existinguser" });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalled();
        });
    });

    // Tests for listing participants in a shared trip
    describe("GET /shared/listParticipants", () => {
        it("should return 401 if user is not logged in", async () => {
            const app = appWithoutUser();
            const res = await request(app).get("/shared/listParticipants").query({ tripId: 1 });
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ error: "Unauthorized" });
            expect(sql).not.toHaveBeenCalled();
        });
        it("should return 403 if user has no access to the trip", async () => {
            const app = appWithUser();
            const res = await request(app).get("/shared/listParticipants").query({ tripId: 999 });
            expect(res.status).toBe(403);
            expect(res.body).toEqual({ error: "Forbidden" });
            expect(sql).toHaveBeenCalledTimes(0);
        });
        it("should return 200 and a list of participants if user has access", async () => {
            const app = appWithUser();
            const res = await request(app).get("/shared/listParticipants");
            expect(res.status).toBe(200);
                  expect(res.body).toEqual({
        participants: [
          { user_id: 1, username: "adam" },
          { user_id: 2, username: "chris" },
          { user_id: 3, username: "hunter" },
        ],
      });
      expect(sql).toHaveBeenCalledTimes(1);
        });
        it("should return 500 if there is a database error", async () => {
            const app = appWithUser();
            sql.__forceError = true;
            const res = await request(app).get("/shared/listParticipants");
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ error: "Internal Server Error" });
            expect(sql).toHaveBeenCalledTimes(1);
        });
    });
});
