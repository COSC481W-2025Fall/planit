import { describe, it, expect, vi, beforeEach } from "vitest";
import * as likesController from "../controllers/likesController.js";
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

describe("Likes Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------
  // toggleLike
  // -------------------------
  it("should like a trip if not already liked", async () => {
    const req = { body: { userId: 1, tripId: 101 } };
    const res = mockRes();

    sql.mockResolvedValueOnce([]); // no existing like
    sql.mockResolvedValueOnce([{ like_id: 1, user_id: 1, trip_id: 101 }]); // new like

    await likesController.toggleLike(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      liked: true,
      message: "Trip liked",
      like: { like_id: 1, user_id: 1, trip_id: 101 },
    });
  });

  it("should unlike a trip if already liked", async () => {
    const req = { body: { userId: 1, tripId: 101 } };
    const res = mockRes();

    sql.mockResolvedValueOnce([{ like_id: 1 }]); // existing like

    await likesController.toggleLike(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      liked: false,
      message: "Trip unliked",
    });
  });

  it("should return 400 if userId or tripId missing in toggleLike", async () => {
    const req = { body: { userId: 1 } };
    const res = mockRes();

    await likesController.toggleLike(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userId and tripId are required" });
  });

  // -------------------------
  // getAllTripDetailsOfTripsLikedByUser
  // -------------------------
  it("should return all trip details liked by a user", async () => {
    const req = { body: { userId: 1 } };
    const res = mockRes();
    const mockData = [
      { trips_id: 101, trip_name: "Beach", trip_location: "Hawaii", liked_at: "2025-10-15" },
    ];
    sql.mockResolvedValue(mockData);

    await likesController.getAllTripDetailsOfTripsLikedByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it("should return 400 if userId missing in getAllTripDetailsOfATripLikedByUser", async () => {
    const req = { body: {} };
    const res = mockRes();

    await likesController.getAllTripDetailsOfTripsLikedByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userId is required" });
  });

  // -------------------------
  // getLikedTripIdsByUser
  // -------------------------
  it("should return only liked trip IDs for a user", async () => {
    const req = { query: { userId: 1 } };
    const res = mockRes();
    const mockLikes = [{ trip_id: 101 }, { trip_id: 203 }];

    sql.mockResolvedValue(mockLikes);

    await likesController.getLikedTripIdsByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ likedTripIds: [101, 203] });
  });

  it("should return 400 if userId missing in getLikedTripIdsByUser", async () => {
    const req = { query: {} };
    const res = mockRes();

    await likesController.getLikedTripIdsByUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userId is required" });
  });
});
