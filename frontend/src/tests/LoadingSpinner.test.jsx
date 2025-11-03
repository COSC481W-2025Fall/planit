import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("react-spinners", () => ({
  MoonLoader: () => <div data-testid="loader" />,
}));
import LoadingSpinner from "../components/LoadingSpinner.jsx";

describe("LoadingSpinner", () => {
  // Test #1: verifies the overlay container is rendered
  it("renders the overlay", () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector(".loading-overlay")).toBeInTheDocument();
  });

  // Test #2: verifies the loader exists (via our mock)
  it("shows a loader", () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });
});
