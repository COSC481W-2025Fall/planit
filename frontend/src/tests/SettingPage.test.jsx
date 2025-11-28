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

const mockCroppieResult = vi.fn(); 

// Mock toast
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('croppie', () => {
  return {
    default: class MockCroppie {
      constructor() {}
      bind() { return Promise.resolve(); }
      // The mock factory now calls the globally scoped spy
      result() { return mockCroppieResult(); } 
      destroy() {}
    }
  };
});

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCroppieResult.mockClear();

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

  test("loads and displays group stats", async () => {
    global.fetch = vi.fn((url, options) => {
      if (url.includes("/auth/login/details")) {
        return Promise.resolve({
          json: () => Promise.resolve({
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
          json: () => Promise.resolve({
            tripCount: 5,
            longestTrip: { trip_name: "Long" },
            mostExpensiveTrip: { trip_name: "Expensive" },
            cheapestTrip: { trip_name: "Cheap" },
            totalMoneySpent: 100,
            totalLikes: 10,
          }),
        });
      }

      if (url.includes("/settingsParticipant/getAllParticipantSettings")) {
        return Promise.resolve({
          json: () => Promise.resolve({
            tripCount: 3,
            longestTrip: { trip_name: "Long" },
            mostExpensiveTrip: { trip_name: "Expensive" },
            cheapestTrip: { trip_name: "Cheap" },
            totalMoneySpent: 250,
            totalLikes: 42,
          }),
        });
      }

      throw new Error("Unhandled fetch: " + url);
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    // Wait for initial user stats to load
    await waitFor(() => {
      expect(screen.getByText("Long")).toBeInTheDocument();
    });

    // Click Group Stats tab
    fireEvent.click(screen.getByText(/Group Stats/i));

    // Wait for group stats to appear
    await waitFor(() => {
      expect(screen.getByText("Trips Shared With You:")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("Long")).toBeInTheDocument();
      expect(screen.getByText("Expensive")).toBeInTheDocument();
      expect(screen.getByText("Cheap")).toBeInTheDocument();
      expect(screen.getByText("250")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  test("opens the cropper modal when an image file is selected", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByTestId("settings-title"));

    const fileInput = screen.getByLabelText(
      (content, element) => element.type === 'file'
    );

    const mockFile = new File([':)'], 'profile.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText("Adjust Profile Picture")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });

  test("crops and saves the profile picture successfully", async () => {
    mockCroppieResult.mockResolvedValue('base64-string-from-cropper');
    
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByTestId("settings-title"));
    const fileInput = screen.getByLabelText(
        (content, element) => element.type === 'file'
    );
    const mockFile = new File([':)'], 'profile.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockCroppieResult).toHaveBeenCalled();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/user/update"), 
        expect.objectContaining({
          body: expect.stringContaining('"customPhoto":"base64-string-from-cropper"')
        })
      );
      
      expect(toast.success).toHaveBeenCalledWith("Profile picture updated successfully!");
    });
    
     expect(screen.queryByText("Adjust Profile Picture")).not.toBeInTheDocument();
  });
});
