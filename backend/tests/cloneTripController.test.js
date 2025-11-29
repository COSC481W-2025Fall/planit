import { describe, it, expect, vi, beforeEach } from "vitest";
import * as cloneController from "../controllers/cloneTripController.js";
import { sql } from "../config/db.js";

vi.mock("../config/db.js", () => ({
    sql: vi.fn(),
}));

const mockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe("getCloneData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return day count for a valid trip", async () => {
    const req = { params: { tripId: "1" } };
    const res = mockRes();

    sql.mockResolvedValueOnce([
      { trips_id: 1, trip_start_date: "2023-01-01", user_id: 1 }
    ]);
    sql.mockResolvedValueOnce([{ count: 5 }]);

    await cloneController.getCloneData(req, res);

    expect(res.json).toHaveBeenCalledWith({ dayCount: 5 });
  });

  it("should return 404 if trip not found", async () => {
    const req = { params: { tripId: "999" } };
    const res = mockRes();

    sql.mockResolvedValueOnce([]);

    await cloneController.getCloneData(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Trip not found" });
  });

  it("should return 500 on database error", async () => {
    const req = { params: { tripId: "1" } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB error"));

    await cloneController.getCloneData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("cloneTrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if new start date is missing", async () => {
    const req = { user: { user_id: 1 }, params: { tripId: "1" }, body: {} };
    const res = mockRes();

    await cloneController.cloneTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "New start date is required"
    });
  });

  it("should return 404 if original trip not found", async () => {
    const req = {
      user: { user_id: 1 },
      params: { tripId: "999" },
      body: { newStartDate: "2023-01-01" }
    };
    const res = mockRes();

    sql.mockResolvedValueOnce([]);

    await cloneController.cloneTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Trip not found" });
  });

  it("should return 403 if user is guest", async () => {
    const req = {
      user: { user_id: "guest_123" },
      params: { tripId: "1" },
      body: { newStartDate: "2023-01-01" }
    };
    const res = mockRes();

    sql.mockResolvedValueOnce([
      { trips_id: 1, trip_start_date: "2023-01-01", user_id: 1 }
    ]);
    sql.mockResolvedValueOnce([]);

    await cloneController.cloneTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Login to clone this trip"
    });
  });

  it("should clone trip successfully", async () => {
    const req = {
      user: { user_id: 1 },
      params: { tripId: "1" },
      body: {
        newStartDate: "2023-01-02",
        newTripName: "Cloned Trip"
      }
    };
    const res = mockRes();

    sql
      .mockResolvedValueOnce([
        { trips_id: 1, trip_start_date: "2023-01-01", user_id: 1 }
      ])
      .mockResolvedValueOnce([
        { day_id: 1, day_date: "2023-01-01" },
        { day_id: 2, day_date: "2023-01-02" }
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ trips_id: 2 }])
      .mockResolvedValueOnce([{ day_id: 3 }])
      .mockResolvedValueOnce([{ day_id: 4 }]);

    await cloneController.cloneTrip(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      newTripId: 2,
      message: "Trip cloned successfully"
    });
  });

  it("should return 500 on database error during cloning", async () => {
    const req = {
      user: { user_id: 1 },
      params: { tripId: "1" },
      body: { newStartDate: "2023-01-02", newTripName: "Cloned Trip" }
    };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB error"));

    await cloneController.cloneTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error"
    });
  });
});