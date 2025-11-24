/**
 * @vitest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import SettingsPage from "../pages/SettingsPage";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import "@testing-library/jest-dom";


// Mock toast
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock fetch globally
    global.fetch = vi.fn((url, options) => {
      if (url.includes("/auth/login/details")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              loggedIn: true,
              user_id: 1,
              first_name: "Test",
              last_name: "User",
              username: "testuser",
            }),
        });
      }

      if (url.includes("/settings/getAllSettings")) {
    return Promise.resolve({
    json: () =>
      Promise.resolve({
        tripCount: 5,
        longestTrip: { trip_name: "Camping" },
        mostExpensiveTrip: { trip_name: "Beach" },
        cheapestTrip: { trip_name: "Up North" },
        totalMoneySpent: 100,
        totalLikes: 10,
          }),
        });
      }

      if (url.includes("/user/update")) {
        const body = JSON.parse(options.body);
        if (body.username === "taken") {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ success: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, user: body }),
        });
      }

      return Promise.reject(new Error("Unhandled fetch: " + url));
    });
  });


  test("renders settings form after user is loaded", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("settings-title")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      expect(screen.getByDisplayValue("User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });
  });

  test("displays stats correctly after loading", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Trips Made/i)).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText(/Longest Trip/i)).toBeInTheDocument();
      expect(screen.getByText("Camping")).toBeInTheDocument();
      expect(screen.getByText(/Most Expensive Trip/i)).toBeInTheDocument();
      expect(screen.getByText("Beach")).toBeInTheDocument();
      expect(screen.getByText(/Cheapest Trip/i)).toBeInTheDocument();
      expect(screen.getByText("Up North")).toBeInTheDocument();
      expect(screen.getByText(/Total Money Spent/i)).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText(/Total Likes/i)).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  test("updates user info successfully", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue("Test"));

    fireEvent.change(screen.getByDisplayValue("Test"), { target: { value: "NewName" } });
    fireEvent.click(screen.getByText(/Save Changes/i));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("User information updated successfully!");
    });
  });

  test("shows error when username is taken", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByDisplayValue("testuser"));

    fireEvent.change(screen.getByDisplayValue("testuser"), { target: { value: "taken" } });
    fireEvent.click(screen.getByText(/Save Changes/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Username already taken. Please try again.");
    });
  });
});
