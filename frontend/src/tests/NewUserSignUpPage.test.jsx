import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";
import UserRegistrationPage from "../pages/NewUserSignUpPage.jsx";

//going back to the trip page once username saved
function TripProbe() {
  return <div data-testid="trip-probe">Trip Page</div>;
}

function renderWithRoutes(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<UserRegistrationPage />} />
        <Route path="/trip" element={<TripProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

//mimic login successful
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          loggedIn: true,
          user_id: 1,
          username: null,
        }),
    })
  );
});

//test logo, heading, and message render on page
describe("UserRegistrationPage", () => {
  test("renders logo, heading, and message", async () => {
    renderWithRoutes();

    await waitFor(() => {
      expect(screen.getByRole("img", { name: /planit logo/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /welcome to planit/i })).toBeInTheDocument();
      expect(
        screen.getByText(/enter a username to start planning your trips/i)
      ).toBeInTheDocument();
    });
  });

  //test enter username and save rendered
  test("renders input and save button", async () => {
    renderWithRoutes();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter username/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  test("typing a username updates the input value", async () => {
    const user = userEvent.setup();
    renderWithRoutes();

    const input = await screen.findByPlaceholderText(/enter username/i);
    await user.type(input, "test");

    expect(input).toHaveValue("test");
  });

  //make sure it brings back to trip page
  test("successful save navigates to /trip", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            loggedIn: true,
            user_id: 1,
            username: null,
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            user: { user_id: 1, username: "kayla" },
          }),
      });

    renderWithRoutes();

    const input = await screen.findByPlaceholderText(/enter username/i);
    await user.type(input, "test");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByTestId("trip-probe")).toHaveTextContent("Trip Page");
    });
  });

  //tests that a error message shows if the username has already been taken
  test("shows error message when username is taken", async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            loggedIn: true,
            user_id: 1,
            username: null,
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Username already taken, try again",
          }),
      });

    renderWithRoutes();

    const input = await screen.findByPlaceholderText(/enter username/i);
    await user.type(input, "test");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/username already taken, try again/i)
      ).toBeInTheDocument();
    });
  });
});
