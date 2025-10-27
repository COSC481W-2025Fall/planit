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
	it("returns trip count for a user", async () => {
		const req = { body: { userID: 1 } };
		const res = mockRes();

		sql.mockResolvedValueOnce([{ trip_count: 3 }]);

		await settingsController.getTripCount(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ tripCount: 3 });
	});

	it("returns 400 if userID missing in getTripCount", async () => {
		const req = { body: {} };
		const res = mockRes();

		await settingsController.getTripCount(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: "userID is required" });
	});

	// getCheapestTrip
	it("returns the cheapest trip when present", async () => {
		const req = { body: { userID: 1 } };
		const res = mockRes();
		const mockRow = { trips_id: 10, trip_name: "Cheap Trip", estimated_total: 50 };

		sql.mockResolvedValueOnce([mockRow]);

		await settingsController.getCheapestTrip(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(mockRow);
	});

	it("returns null when no cheapest trip found", async () => {
		const req = { body: { userID: 1 } };
		const res = mockRes();

		sql.mockResolvedValueOnce([]);

		await settingsController.getCheapestTrip(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(null);
	});

	// getTotalMoneySpent
	it("returns total money spent as sum of activity estimates", async () => {
		const req = { body: { userID: 1 } };
		const res = mockRes();

		sql.mockResolvedValueOnce([{ total_money_spent: 180 }]);

		await settingsController.getTotalMoneySpent(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ totalMoneySpent: 180 });
	});

	it("returns 0 when no activity estimates exist", async () => {
		const req = { body: { userID: 1 } };
		const res = mockRes();

		// controller COALESCEs to 0, so the query returns [{ total_money_spent: 0 }]
		sql.mockResolvedValueOnce([{ total_money_spent: 0 }]);

		await settingsController.getTotalMoneySpent(req, res);

		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith({ totalMoneySpent: 0 });
	});
});

