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
  // getTripCount
  it("should return trip count for valid userID", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();
    //make sure result of query passed as json
    sql.mockResolvedValueOnce([{ trip_count: 5 }]);

    await settingsController.getTripCount(req, res);  

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ tripCount: 5 });
  }
  );

  //check error handling of endpoint if no userID provided
  it("should return 400 if userID is missing in getTripCount", async () => {
    const req = { body: {} };
    const res = mockRes();
    await settingsController.getTripCount(req, res);  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  }
  );

});

// getTotalMoneySpent
it("should return total money spent for valid userID", async () => {
  const req = { body: { userID: 1 } };
  const res = mockRes();
  //make sure results of SQL query get passed as json 
  sql.mockResolvedValueOnce([{ total_money_spent: 2500 }]);

  await settingsController.getTotalMoneySpent(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ totalMoneySpent: 2500 });
});

//check error handling in endpoint of no userID
it("should return 400 if userID is missing in getTotalMoneySpent", async () => {
  const req = { body: {} };
  const res = mockRes();

  await settingsController.getTotalMoneySpent(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
});

//check error handling in endpoint if cannot fetch from database
it("should return 500 if SQL throws in getTotalMoneySpent", async () => {
  const req = { body: { userID: 1 } };
  const res = mockRes();
  sql.mockRejectedValueOnce(new Error("DB failure"));

  await settingsController.getTotalMoneySpent(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
});

//getCheapestTrip
 it("should return the cheapest trip for a valid user", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    //mock query response
    const mockTrip = [{ trip_name: "Local Getaway", trip_id: 10 }];
    sql.mockResolvedValueOnce(mockTrip);

    await settingsController.getCheapestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTrip[0]);
  });

  it("should return 400 if userID is missing in getCheapestTrip", async () => {
    const req = { body: {} };
    const res = mockRes();

    await settingsController.getCheapestTrip(req, res);

    //check for 400 if no userID is given in request
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should return null if no trips exist in getCheapestTrip", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql.mockResolvedValueOnce([]); 

    await settingsController.getCheapestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(null);
  });

  //getMostExpensiveTrip
   it("should return the most expensive trip for a valid user", async () => {
    const req = { body: { userID: 2 } };
    const res = mockRes();
    //mock query response
    const mockTrip = [{ trip_name: "Luxury Cruise", trip_id: 20 }];
    sql.mockResolvedValueOnce(mockTrip);

    await settingsController.getMostExpensiveTrip(req, res);

    //make sure 200 is thrown
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTrip[0]);
  });

  it("should return 400 if userID is missing in getMostExpensiveTrip", async () => {
    const req = { body: {} };
    const res = mockRes();

    await settingsController.getMostExpensiveTrip(req, res);

    //400 should be thrown if no userID provided
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should return null if no trips exist in getMostExpensiveTrip", async () => {
    const req = { body: { userID: 2 } };
    const res = mockRes();

    sql.mockResolvedValueOnce([]); // no trips found

    await settingsController.getMostExpensiveTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(null);
  });

  //getLongestTrip
it("should return the longest trip for a valid user", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    const mockTrip = [
      { trip_name: "Europe Adventure", trip_id: 5, total_days: 14 },
    ];
    sql.mockResolvedValueOnce(mockTrip);

    await settingsController.getLongestTrip(req, res);

    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTrip[0]);
  });

  it("should return 400 if userID is missing in getLongestTrip", async () => {
    const req = { body: {} };
    const res = mockRes();

    await settingsController.getLongestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should handle SQL errors in getLongestTrip", async () => {
    const req = { body: { userID: 1 } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB failure"));

    await settingsController.getLongestTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

  //getTotalLikes
  it("should return total likes for a valid user", async () => {
    const req = { body: { userID: 2 } };
    const res = mockRes();

    const mockLikes = [{ total_likes: 42 }];
    sql.mockResolvedValueOnce(mockLikes);

    await settingsController.getTotalLikes(req, res);

    expect(sql).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ totalLikes: 42 });
  });

  it("should return 400 if userID is missing in getTotalLikes", async () => {
    const req = { body: {} };
    const res = mockRes();

    await settingsController.getTotalLikes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
  });

  it("should handle SQL errors in getTotalLikes", async () => {
    const req = { body: { userID: 2 } };
    const res = mockRes();

    sql.mockRejectedValueOnce(new Error("DB failure"));

    await settingsController.getTotalLikes(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });