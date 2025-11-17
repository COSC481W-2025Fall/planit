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

describe("Settings Participant Controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    //getParticipantTripCount Tests
    it("should return participant trip count for valid userID", async () => {
        const req = { body: { userID: 1 } };
        const res = mockRes();

        sql.mockResolvedValueOnce([{ tripcount: 3 }]);

        await participantController.getParticipantTripCount(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ tripCount: 3 });
    });

    it("should return 400 if userID is missing in getParticipantTripCount", async () => {
        const req = { body: {} };
        const res = mockRes();

        await participantController.getParticipantTripCount(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
    });

    it("should return 500 if database error occurs in getParticipantTripCount", async () => {
        const req = { body: { userID: 1 } };
        const res = mockRes();

        sql.mockRejectedValueOnce(new Error("Database error"));

        await participantController.getParticipantTripCount(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });

    //getParticipantLongestTrip Tests

    it("should return longest participant trip for valid userID", async () => {
        const req = { body: { userID: 1 } };
        const res = mockRes();

        const mockTrip = [
            { trip_name: "Vegas Trip", trip_id: 9, total_days: 6 },
        ];
        sql.mockResolvedValueOnce(mockTrip);

        await participantController.getParticipantLongestTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockTrip[0]);
    });

    it("should return 400 if userID is missing in getParticipantLongestTrip", async () => {
        const req = { body: {} };
        const res = mockRes();

        await participantController.getParticipantLongestTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
    });

    it("should return null if no participant trips exist in getParticipantLongestTrip", async () => {
        const req = { body: { userID: 1 } };
        const res = mockRes();

        sql.mockResolvedValueOnce([]);

        await participantController.getParticipantLongestTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(null);
    });

    it("should return 500 if SQL fails in getParticipantLongestTrip", async () => {
        const req = { body: { userID: 1 } };
        const res = mockRes();

        sql.mockRejectedValueOnce(new Error("DB failure"));

        await participantController.getParticipantLongestTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });

    //getParticipantTotalLikes Tests
    it("should return total likes for participant trips", async () => {
    const req = { body: { userID: 2 } };
    const res = mockRes();

    sql.mockResolvedValueOnce([{ total_likes: 12 }]);

    await participantController.getParticipantTotalLikes(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ totalLikes: 12 });
  });

  it("should return 400 if userID is missing in getParticipantTotalLikes", async () => {
    const req = { body: {} };
    const res = mockRes();

    await participantController.getParticipantTotalLikes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should return 500 on SQL error in getParticipantTotalLikes", async () => {
    const req = { body: { userID: 2 } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB failure"));

    await participantController.getParticipantTotalLikes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

    //getParticipantCheapestTrip Tests
    it("should return the cheapest participant trip", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    const mockTrip = [{ trip_name: "Cheap Weekend", trip_id: 4 }];
    sql.mockResolvedValueOnce(mockTrip);

    await participantController.getParticipantCheapestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTrip[0]);
  });

  it("should return 400 if userID is missing in getParticipantCheapestTrip", async () => {
    const req = { body: {} };
    const res = mockRes();

    await participantController.getParticipantCheapestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should return null if no participant trips exist in getParticipantCheapestTrip", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql.mockResolvedValueOnce([]);

    await participantController.getParticipantCheapestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(null);
  });

  it("should return 500 if SQL fails in getParticipantCheapestTrip", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB failure"));

    await participantController.getParticipantCheapestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

    //getParticipantMostExpensiveTrip Tests