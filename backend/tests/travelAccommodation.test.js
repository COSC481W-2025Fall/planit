import { describe, it, expect, vi, beforeEach } from "vitest";
import * as transportController from "../controllers/travelAccommodationController.js";

// Mock the sql import
vi.mock("../config/db.js", () => ({
sql: vi.fn(),
}));

import { sql } from "../config/db.js";

describe("Transport & Accommodation Controllers", () => {
beforeEach(() => {
vi.clearAllMocks();
});

//Test addTransportInfo
describe("addTransportInfo", () => {
it("should add transport successfully", async () => {
const req = { body: { trip_id: 1, transport_type: "Bus" } };
const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
sql.mockResolvedValue([{ transport_id: 1, ...req.body }]);


  await transportController.addTransportInfo(req, res);

  expect(res.json).toHaveBeenCalledWith({
    message: "Transport added successfully",
    transport: { transport_id: 1, ...req.body },
  });
});

it("should return 400 if required fields missing", async () => {
  const req = { body: { transport_type: "Bus" } };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

  await transportController.addTransportInfo(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
});


});

//Test readTransportInfo
describe("readTransportInfo", () => {
it("should retrieve transport info", async () => {
const req = { query: { trip_id: 1 } };
const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
sql.mockResolvedValue([{ transport_id: 1, trip_id: 1 }]);


  await transportController.readTransportInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Transport info retrieved successfully",
    transportInfo: [{ transport_id: 1, trip_id: 1 }],
  });
});

it("should return 400 if trip_id missing", async () => {
  const req = { query: {} };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

  await transportController.readTransportInfo(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
});


});

//Test updateTransportInfo
describe("updateTransportInfo", () => {
it("should update transport successfully", async () => {
const req = { body: { transport_id: 1, transport_type: "Train" } };
const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
sql.mockResolvedValue([{ transport_id: 1, transport_type: "Train" }]);


  await transportController.updateTransportInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Transport info updated successfully",
    transportInfo: { transport_id: 1, transport_type: "Train" },
  });
});

it("should return 404 if transport not found", async () => {
  const req = { body: { transport_id: 999 } };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  sql.mockResolvedValue([]);

  await transportController.updateTransportInfo(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({ error: "Transport not found" });
});

it("should return 400 if transport_id missing", async () => {
  const req = { body: {} };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

  await transportController.updateTransportInfo(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
});


});

//Test deleteTransportInfo
describe("deleteTransportInfo", () => {
it("should delete transport successfully", async () => {
const req = { body: { transport_id: 1 } };
const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
sql.mockResolvedValue([]);


  await transportController.deleteTransportInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Transport info deleted successfully",
  });
});

it("should return 400 if transport_id missing", async () => {
  const req = { body: {} };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

  await transportController.deleteTransportInfo(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
});


});

//Test addAccommodationInfo
describe("Accommodation Controllers", () => {
it("should add accommodation successfully", async () => {
const req = { body: { trip_id: 1, accommodation_type: "Hotel" } };
const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
sql.mockResolvedValue([{ accommodation_id: 1, ...req.body }]);


  await transportController.addAccommodationInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Accommodation added successfully",
    accommodation: { accommodation_id: 1, ...req.body },
  });
});

it("should return 400 if trip_id missing", async () => {
  const req = { body: { accommodation_type: "Hotel" } };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

  await transportController.addAccommodationInfo(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" });
});

//Test readAccommodationInfo
it("should retrieve accommodation info successfully", async () => {
  const req = { query: { trip_id: 1 } };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  sql.mockResolvedValue([{ accommodation_id: 1, trip_id: 1 }]);

  await transportController.readAccommodationInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Accommodation info retrieved successfully",
    accommodationInfo: [{ accommodation_id: 1, trip_id: 1 }],
  });
});

//Test updateAccommodationInfo
it("should update accommodation successfully", async () => {
  const req = { body: { accommodation_id: 1, accommodation_type: "Hostel" } };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  sql.mockResolvedValue([{ accommodation_id: 1, accommodation_type: "Hostel" }]);

  await transportController.updateAccommodationInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Accommodation info updated successfully",
    accommodationInfo: { accommodation_id: 1, accommodation_type: "Hostel" },
  });
});

//Test deleteAccommodationInfo
it("should delete accommodation successfully", async () => {
  const req = { body: { accommodation_id: 1 } };
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  sql.mockResolvedValue([]);

  await transportController.deleteAccommodationInfo(req, res);
  expect(res.json).toHaveBeenCalledWith({
    message: "Accommodation info deleted successfully",
  });
});


});
});
