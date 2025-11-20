import { describe, it, expect, vi, beforeEach } from "vitest";
import * as participantController from "../controllers/settingsParticipantController.js";
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

describe("getAllParticipantSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

   it("should return all participant stats for a valid userID", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql
      .mockResolvedValueOnce([{ tripcount: 5 }]) // tripCount
      .mockResolvedValueOnce([{ trip_name: "Trip A", trip_id: 1, total_days: 7 }]) // longestTrip
      .mockResolvedValueOnce([{ total_likes: 10 }]) // totalLikes
      .mockResolvedValueOnce([{ trip_name: "Trip B", trip_id: 2 }]) // cheapestTrip
      .mockResolvedValueOnce([{ trip_name: "Trip C", trip_id: 3 }]) // mostExpensiveTrip
      .mockResolvedValueOnce([{ total_money_spent: 1000 }]); // totalMoneySpent

    await participantController.getAllParticipantSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      tripCount: 5,
      longestTrip: { trip_name: "Trip A", trip_id: 1, total_days: 7 },
      totalLikes: 10,
      cheapestTrip: { trip_name: "Trip B", trip_id: 2 },
      mostExpensiveTrip: { trip_name: "Trip C", trip_id: 3 },
      totalMoneySpent: 1000
    });
  });

  it("should return 400 if userID is missing", async () => {
    const req = { body: {} };
    const res = mockRes();

    await participantController.getAllParticipantSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should return 500 if there is a database error", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("Database error"));

    await participantController.getAllParticipantSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});