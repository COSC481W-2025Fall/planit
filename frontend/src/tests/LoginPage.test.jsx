import {describe, test, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "../pages/LoginPage.jsx";

describe("LoginPage Component", () => {
    test("renders the main welcome heading", () => {
        render(<LoginPage/>);
        expect(screen.getByRole("heading", {name: /welcome to planit/i})).toBeInTheDocument();
    });

    test("renders the sign in heading", () => {
        render(<LoginPage/>);
        expect(screen.getByRole("heading", {name: /sign in/i})).toBeInTheDocument();
    });

    test("renders the paragraph under welcome heading", () => {
        render(<LoginPage/>);
        expect(screen.getByText(/sign in to start planning your trips/i)).toBeInTheDocument();
    });
});
