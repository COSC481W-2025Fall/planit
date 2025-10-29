import { describe, it, expect, vi, beforeEach } from "vitest";
import * as settingsController from "../controllers/settingsController.js";
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

describe("Settings Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  }); 
  // -------------------------
  // getTripCount
  // -------------------------
  it("should return trip count for valid userID", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();
    sql.mockResolvedValueOnce([{ trip_count: 5 }]);
    await settingsController.getTripCount(req, res);  
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ tripCount: 5 });
  }
  );

  it("should return 400 if userID is missing in getTripCount", async () => {
    const req = { body: {} };
    const res = mockRes();
    await settingsController.getTripCount(req, res);  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  }
  );

});