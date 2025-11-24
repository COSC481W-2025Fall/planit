import React from "react"; // ✅ ensure React is imported
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import ExplorePage from "../pages/ExplorePage";
import { MemoryRouter } from "react-router-dom";

// --- MOCK TRIP CARD --- //
vi.mock("../components/TripCardPublic", () => {
  const React = require("react"); // Important!
  return {
    default: ({ trip }) => React.createElement("div", { "data-testid": "trip-card" }, String(trip.trips_id)),
  };
});

// --- MOCK API --- //
const mockGetUser = vi.fn();
const mockGetAllTripLocations = vi.fn();
const mockGetTrendingTrips = vi.fn();
const mockGetTopLikedTrips = vi.fn();

vi.mock("../../api/explore", () => ({
  getUser: mockGetUser,
  getAllTripLocations: mockGetAllTripLocations,
  getTrendingTrips: mockGetTrendingTrips,
  getTopLikedTrips: mockGetTopLikedTrips,
}));

// --- MOCK FETCH --- //
global.fetch = vi.fn((url) => {
  if (url.includes("/auth/login/details")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ loggedIn: true, user_id: 1 }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  });
});

describe("ExplorePage — Trending Carousel", () => {
  test("Hides arrow buttons when trending list is empty", async () => {
    mockGetAllTripLocations.mockResolvedValue([]);
    mockGetTrendingTrips.mockResolvedValue([]);
    mockGetTopLikedTrips.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>
    );

    await screen.findByText("Trending This Week");

    const leftArrows = screen.queryAllByRole("button", { name: /chevronleft/i });
    const rightArrows = screen.queryAllByRole("button", { name: /chevronright/i });
    expect(leftArrows.length).toBe(0);
    expect(rightArrows.length).toBe(0);

    expect(
      screen.getByText(/No top trips yet.|No trending trips/i)
    ).toBeDefined();
  });

});