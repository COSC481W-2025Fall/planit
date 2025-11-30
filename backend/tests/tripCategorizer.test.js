import { describe, it, expect, vi } from "vitest";
import { categorizeTrip } from "../utils/tripCategorizer.js";
import client from "../utils/tripCategorizer.js";

describe("Trip Categorizer Backend", () => {

  it("should return null when OpenAI mock returns an invalid category", async () => {
    const result = await categorizeTrip("Test Trip", [
      { activity_name: "Hiking" }
    ]);

    expect(result).toBe(null);
  });

  it("should return a valid category when OpenAI mock is overridden", async () => {
    client.chat.completions.create = vi.fn().mockResolvedValue({
      choices: [{ message: { content: "Adventure" } }]
    });

    const result = await categorizeTrip("Test Trip", [
      { activity_name: "Kayaking" }
    ]);

    expect(result).toBe("Adventure");
  });

  it("should safely return null if an exception occurs", async () => {
    client.chat.completions.create = vi.fn().mockRejectedValue(
      new Error("Mock failure")
    );

    const result = await categorizeTrip("Trip Name", []);

    expect(result).toBe(null);
  });

});