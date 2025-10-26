import { describe, it, expect, vi, beforeEach } from "vitest";
import * as exploreController from "../controllers/exploreController.js";
import { sql } from "../config/db.js";

// mock the sql tag function
vi.mock("../config/db.js", () => ({
  sql: vi.fn()
}));

// helper to mock req and res
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("Explore Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------
  // getAllTripLocations
  // -------------------------
  it("should return all public trip locations", async () => {
    const req = {};
    const res = mockRes();
    const mockLocations = [{ trip_location: "Hawaii" }, { trip_location: "Paris" }];
    sql.mockResolvedValue(mockLocations);

    await exploreController.getAllTripLocations(req, res);

    expect(sql).toHaveBeenCalled();
    expect(sql.mock.calls[0][0][0]).toContain("FROM trips");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockLocations);
  });

  it("should handle errors in getAllTripLocations", async () => {
    const req = {};
    const res = mockRes();
    sql.mockRejectedValue(new Error("DB error"));

    await exploreController.getAllTripLocations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

  // -------------------------
  // getTopLikedTrips
  // -------------------------
  it("should return top liked trips", async () => {
    const req = { body: { userId: 1 } }; // <-- pass userId here
    const res = mockRes();
    const mockTrips = [
      { trip_name: "Beach Getaway", like_count: 20, is_liked: true }
    ];
    sql.mockResolvedValue(mockTrips);

    await exploreController.getTopLikedTrips(req, res);

    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTrips);
  });

  it("should handle errors in getTopLikedTrips", async () => {
    const req = { body: { userId: 1 } };
    const res = mockRes();
    sql.mockRejectedValue(new Error("DB failed"));

    await exploreController.getTopLikedTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

  // -------------------------
  // getTrendingTrips
  // -------------------------
  it("should return trending trips", async () => {
    const req = { body: { userId: 1 } }; // <-- pass userId here
    const res = mockRes();
    const mockTrending = [
      { trip_name: "New York Adventure", like_count: 5, is_liked: false }
    ];
    sql.mockResolvedValue(mockTrending);

    await exploreController.getTrendingTrips(req, res);
    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTrending);
  });

  it("should handle errors in getTrendingTrips", async () => {
    const req = { body: { userId: 1 } };
    const res = mockRes();
    sql.mockRejectedValue(new Error("DB timeout"));

    await exploreController.getTrendingTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

  // -------------------------
  // searchTrips
  // -------------------------
  it("should return search results for location", async () => {
    const req = { body: { location: "Paris", userId: 1 } }; // <-- pass userId here
    const res = mockRes();
    const mockResults = [
      { trip_name: "Paris Getaway", like_count: 10, is_liked: true }
    ];
    sql.mockResolvedValue(mockResults);

    await exploreController.searchTrips(req, res);

    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResults);
  });

  it("should handle errors in searchTrips", async () => {
    const req = { body: { location: "Paris", userId: 1 } };
    const res = mockRes();
    sql.mockRejectedValue(new Error("Query error"));

    await exploreController.searchTrips(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});
