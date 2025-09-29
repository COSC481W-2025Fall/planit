import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import SettingsPage from "../pages/SettingsPage.jsx";

describe("SettingsPage (placeholder)", () => {
    beforeEach(() => {
        // fake fetch that always returns a logged in user
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ loggedIn: true, name: "Test User" }),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("shows Loading... when no user yet", () => {
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

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test("shows Settings title when user is logged in", async () => {
        render(
            <MemoryRouter>
                <SettingsPage />
            </MemoryRouter>
        );

        // find all "Settings" and pick the one that is the page title
        const nodes = await screen.findAllByText(/settings/i);
        const title = nodes.find((n) => n.classList?.contains("trips-title"));
        expect(title).toBeInTheDocument();

        // check the sign out button
        expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });
});
