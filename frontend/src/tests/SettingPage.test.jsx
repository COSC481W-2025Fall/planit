import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import SettingsPage from "../pages/SettingsPage.jsx";

describe("SettingsPage (placeholder)", () => {
    beforeEach(() => {
        // mock fetch that by default returns a logged-in user
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ loggedIn: true, name: "Test User" }),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("shows Loading... when no user yet", async () => {
        // make fetch say user is not logged in
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ loggedIn: false }),
        });

        render(
            <MemoryRouter>
                <SettingsPage />
            </MemoryRouter>
        );

        // use findByTestId to safely wait for the loader to appear
        const loader = await screen.findByTestId("loader");
        expect(loader).toBeInTheDocument();
    });

    test("shows Settings title when user is logged in", async () => {
        render(
            <MemoryRouter>
                <SettingsPage />
            </MemoryRouter>
        );

        // wait for Settings title
        const title = await screen.findByTestId("settings-title");
        expect(title).toBeInTheDocument();

        // verify Sign Out button appears from TopBanner
        expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });
});
