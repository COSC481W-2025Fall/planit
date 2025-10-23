import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TopBanner from "../components/TopBanner.jsx";

describe("TopBanner Component", () => {
    test("renders logo and sign out button", () => {
        render(<TopBanner user={{ name: "Test User" }} onSignOut={() => {}} />);

        expect(screen.getByRole("img", { name: /planit logo/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    test("calls onSignOut when sign out clicked", async () => {
        const user = userEvent.setup();
        const mockSignOut = vi.fn();

        await user.click(screen.getByRole("button", { name: /sign out/i }));
        expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
});

