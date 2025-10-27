import { describe, test, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TopBanner from "../components/TopBanner.jsx";

global.fetch = vi.fn();

delete window.location;
window.location = { href: "" };

describe("TopBanner Component", () => {
    beforeEach(() => {
        fetch.mockReset();
        window.location.href = "";
    });

    test("renders logo and sign out button", () => {
        render(<TopBanner user={{ name: "Test User" }} onSignOut={() => { }} />);

        expect(screen.getByRole("img", { name: /planit logo/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    test("sign out calls logout endpoint and redirects to login", async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({ ok: true });

        render(<TopBanner user={{ name: "Test User" }} />);
        await user.click(screen.getByRole("button", { name: /sign out/i }));

        expect(fetch).toHaveBeenCalledTimes(1);
        const [calledUrl, options] = fetch.mock.calls[0];
        expect(calledUrl).toMatch(/\/auth\/logout$/);
        expect(options).toMatchObject({ credentials: "include" });

        await waitFor(() => {
            expect(window.location.href).toBe("/login");
        });
    });
});

