import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllSettings } from "../controllers/settingsController.js";
import { sql } from "../config/db.js";
import {updateUser} from "../controllers/userController.js";

vi.mock("../config/db.js", () => ({
  sql: vi.fn(),
}));

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("getAllSettings Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all user stats for a valid userID", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    // Mock results of each SQL call inside Promise.all
    sql
      .mockResolvedValueOnce([{ trip_count: 4 }])              
      .mockResolvedValueOnce([{ trip_name: "Longest", trips_id: 9, total_days: 12 }]) 
      .mockResolvedValueOnce([{ total_likes: 15 }])            
      .mockResolvedValueOnce([{ trip_name: "Cheap", trips_id: 1, trip_price_estimate: 100 }]) 
      .mockResolvedValueOnce([{ trip_name: "Expensive", trips_id: 2, trip_price_estimate: 900 }]) 
      .mockResolvedValueOnce([{ total_money_spent: 3000 }]);   

    await getAllSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      tripCount: 4,
      longestTrip: { trip_name: "Longest", trips_id: 9, total_days: 12 },
      totalLikes: 15,
      cheapestTrip: { trip_name: "Cheap", trips_id: 1, trip_price_estimate: 100 },
      mostExpensiveTrip: { trip_name: "Expensive", trips_id: 2, trip_price_estimate: 900 },
      totalMoneySpent: 3000,
    });
  });

  it("should return 400 if userID is missing", async () => {
    const req = { body: {} };
    const res = mockRes();

    await getAllSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should return 400 if username does not match regex", async () => {
    const req = {
      body: {
        userId: 1,
        username: "sample$bad@username!",
        firstname: "John",
        lastname: "Doe",
      },
    };
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid. Letters, numbers, and '_' only. Min length: 2, max length: 20",
    });
    // Should not hit DB when validation fails
    expect(sql).not.toHaveBeenCalled();
  });

  it("should return null for trip-based fields if SQL returns empty arrays", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql
      .mockResolvedValueOnce([{ trip_count: 0 }]) // tripCount
      .mockResolvedValueOnce([])                  // longestTrip
      .mockResolvedValueOnce([{ total_likes: 0 }])
      .mockResolvedValueOnce([])                  // cheapestTrip
      .mockResolvedValueOnce([])                  // mostExpensiveTrip
      .mockResolvedValueOnce([{ total_money_spent: 0 }]);

    await getAllSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      tripCount: 0,
      longestTrip: null,
      totalLikes: 0,
      cheapestTrip: null,
      mostExpensiveTrip: null,
      totalMoneySpent: 0,
    });
  });

  it("should return 500 if SQL throws an error", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB failure"));

    await getAllSettings(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});
