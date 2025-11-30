import {describe, test, expect, vi, beforeEach} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {MemoryRouter} from "react-router-dom";
import TopBanner from "../components/TopBanner.jsx";

global.fetch = vi.fn();

delete window.location;
window.location = {href: ""};

describe("TopBanner Component", () => {
    beforeEach(() => {
        fetch.mockReset();
        window.location.href = "";
    });

  // mock fetch
    global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
        })
    );


    test("renders logo and sign out button", () => {
        render(
            <MemoryRouter>
                <TopBanner user={{name: "Test User"}} onSignOut={() => {
                }}/>
            </MemoryRouter>
        );

        expect(screen.getByRole("img", {name: /planit logo/i})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /sign out/i})).toBeInTheDocument();
    });

    test("sign out calls logout endpoint and redirects to login", async () => {
        const user = userEvent.setup();
        fetch.mockResolvedValueOnce({ok: true});

        render(
            <MemoryRouter>
                <TopBanner user={{name: "Test User"}}/>
            </MemoryRouter>
        );
        await user.click(screen.getByRole("button", {name: /sign out/i}));

        const logoutCall = fetch.mock.calls.find(([url]) =>
            url.match(/\/auth\/logout$/)
        );

        expect(logoutCall).toBeDefined();
        const [, options] = logoutCall;
        expect(options).toMatchObject({ credentials: "include" });

        await waitFor(() => {
            expect(window.location.href).toBe("/login");
        });
    });
});

