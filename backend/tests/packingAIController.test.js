// packingPredictController.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios and Constants
vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock("../../Constants.js", () => ({
    AI_BACKEND_URL: "http://python-service",
}));

import axios from "axios";
import { health, predictItems } from "../controllers/packingAIController.js";

const createMockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe("packingPredictController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("health check returns ok=true and python data when the Python service is reachable", async () => {
        const mockPythonData = { status: "alive" };
        axios.get.mockResolvedValueOnce({ data: mockPythonData });

        const req = {};
        const res = createMockRes();

        await health(req, res);

        expect(axios.get).toHaveBeenCalledWith(
            "http://python-service/health",
            { timeout: 3000 }
        );

        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            python: mockPythonData,
        });

        expect(res.status).not.toHaveBeenCalled();
    });

    it("health check returns 503 and error payload when the Python service is unreachable", async () => {
        const error = new Error("connect ECONNREFUSED");
        axios.get.mockRejectedValueOnce(error);

        const req = {};
        const res = createMockRes();

        await health(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            error: "python service unreachable",
            detail: error.message,
        });
    });

    it("forwards the trip body to the Python service and returns its response", async () => {
        const tripPayload = {
            destination: "Chicago",
            start_date: "2025-01-05",
            end_date: "2025-01-07",
        };

        const pythonResponse = {
            predicted_items: [
                { item_id: 1, item_name: "Jacket", prob: 0.9 },
            ],
            status: "success",
        };

        axios.post.mockResolvedValueOnce({ data: pythonResponse });

        const req = { body: tripPayload };
        const res = createMockRes();

        await predictItems(req, res);

        expect(axios.post).toHaveBeenCalledWith(
            "http://python-service/predict",
            tripPayload,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 8000,
            }
        );

        expect(res.json).toHaveBeenCalledWith(pythonResponse);
        expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 503 and error payload when the Python service call fails", async () => {
        const tripPayload = { destination: "Nowhere" };
        const error = new Error("timeout of 8000ms exceeded");

        axios.post.mockRejectedValueOnce(error);

        const req = { body: tripPayload };
        const res = createMockRes();

        await predictItems(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            error: "python service unreachable",
            detail: error.message,
        });
    });
});