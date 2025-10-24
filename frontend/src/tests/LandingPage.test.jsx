import {describe, test, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter, Routes, Route} from "react-router-dom";
import "@testing-library/jest-dom";
import LandingPage from "../pages/LandingPage.jsx";

function LoginProbe() {
    return <div data-testid="login-probe">Login Page</div>;
}

function renderWithRoutes(initialEntries = ["/"]) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path="/" element={<LandingPage/>}/>
                <Route path="/login" element={<LoginProbe/>}/>
            </Routes>
        </MemoryRouter>
    );
}

describe("LandingPage", () => {
    test("renders logo, hero heading, and subcopy", () => {
        render(
            <MemoryRouter>
                <LandingPage/>
            </MemoryRouter>
        );

        // Logo via alt text
        expect(screen.getByRole("img", {name: /planit logo/i})).toBeInTheDocument();

        // H1 (it contains <br/> and a <span>, but role/name should still match)
        expect(
            screen.getByRole("heading", {level: 1, name: /the most effective way to/i})
        ).toBeInTheDocument();

        // Hero sub text
        expect(
            screen.getByText(/create incredible travel experiences with friends/i)
        ).toBeInTheDocument();

        // A couple feature cards (spot-check)
        expect(screen.getByRole("heading", {name: /plan with friends/i})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: /discover places/i})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: /smart scheduling/i})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: /budget friendly/i})).toBeInTheDocument();

        // Footer year
        expect(screen.getByText(/© 2025 planit/i)).toBeInTheDocument();
    });

    test("header 'Get Started' button navigates to /login", async () => {
        const user = userEvent.setup();
        renderWithRoutes();

        await user.click(screen.getByRole("button", {name: /get started/i}));
        expect(screen.getByTestId("login-probe")).toHaveTextContent("Login Page");
    });

    test("hero 'Start Planning' button navigates to /login", async () => {
        const user = userEvent.setup();
        renderWithRoutes();

        await user.click(screen.getByRole("button", {name: /start planning/i}));
        expect(screen.getByTestId("login-probe")).toHaveTextContent("Login Page");
    });

    test("'Log In' link points to /login", () => {
        render(
            <MemoryRouter>
                <LandingPage/>
            </MemoryRouter>
        );
        const link = screen.getByRole("link", {name: /log in/i});
        expect(link).toHaveAttribute("href", "/login");
    });
});
