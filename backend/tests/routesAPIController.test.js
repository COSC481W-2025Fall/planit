import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { distanceByTransportation } from "../controllers/routesAPIController.js";

vi.mock("axios");

describe("distanceByTransportation", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        origin: { latitude: 40.7128, longitude: -74.006 },
        destination: { latitude: 34.0522, longitude: -118.2437 },
        wayOfTransportation: "DRIVE"
      }
    };

    res = {
      json: vi.fn(),
      status: vi.fn(() => res)
    };
  });

  it("should return distance and duration for a valid DRIVE route", async () => {
    axios.post.mockResolvedValue({
      data: {
        routes: [
          {
            distanceMeters: 4500000,
            duration: { seconds: 160000 }
          }
        ]
      }
    });

    await distanceByTransportation(req, res);

    expect(res.json).toHaveBeenCalledWith({
      distanceMiles: Math.round((4500000 / 1609.34) * 100) / 100,
      durationSeconds: 160000
    });
  });

  it("should return distance and duration for a WALK route", async () => {
    req.body.wayOfTransportation = "WALK";

    axios.post.mockResolvedValue({
      data: {
        routes: [
          {
            distanceMeters: 5000,
            duration: { seconds: 3600 }
          }
        ]
      }
    });

    await distanceByTransportation(req, res);

    expect(res.json).toHaveBeenCalledWith({
      distanceMiles: Math.round((5000 / 1609.34) * 100) / 100,
      durationSeconds: 3600
    });
  });

  it("should return distance and duration for a BICYCLE route", async () => {
    req.body.wayOfTransportation = "BICYCLE";

    axios.post.mockResolvedValue({
      data: {
        routes: [
          {
            distanceMeters: 12000,
            duration: { seconds: 1800 }
          }
        ]
      }
    });

    await distanceByTransportation(req, res);

    expect(res.json).toHaveBeenCalledWith({
      distanceMiles: Math.round((12000 / 1609.34) * 100) / 100,
      durationSeconds: 1800
    });
  });

  it("should return distance and duration for a TRANSIT route", async () => {
    req.body.wayOfTransportation = "TRANSIT";

    axios.post.mockResolvedValue({
      data: {
        routes: [
          {
            distanceMeters: 8000,
            duration: "2400s"
          }
        ]
      }
    });

    await distanceByTransportation(req, res);

    expect(res.json).toHaveBeenCalledWith({
      distanceMiles: Math.round((8000 / 1609.34) * 100) / 100,
      durationSeconds: 2400
    });
  });

  it("should return nulls if no route is found", async () => {
    axios.post.mockResolvedValue({ data: { routes: [] } });

    await distanceByTransportation(req, res);

    expect(res.json).toHaveBeenCalledWith({
      distanceMiles: null,
      durationSeconds: null
    });
  });

  it("should return 500 if axios throws an error", async () => {
    axios.post.mockRejectedValue(new Error("API error"));

    await distanceByTransportation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });
});
