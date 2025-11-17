import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import GuestEmptyState from "../components/GuestEmptyState";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("GuestEmptyState", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      title: "Test Title",
      description: "Test Description",
    };
    return render(
      <MemoryRouter>
        <GuestEmptyState {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  it("renders with title and description", () => {
    renderComponent();
    
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("displays all feature list items", () => {
    renderComponent();
    
    expect(screen.getByText("Create unlimited trips")).toBeInTheDocument();
    expect(screen.getByText("Save your itineraries permanently")).toBeInTheDocument();
    expect(screen.getByText("Share trips with friends and family")).toBeInTheDocument();
    expect(screen.getByText("Like and save other travelers' trips")).toBeInTheDocument();
    expect(screen.getByText("Access your trips from any device")).toBeInTheDocument();
  });

  it("displays feature section heading", () => {
    renderComponent();
    
    expect(screen.getByText("With an account, you can:")).toBeInTheDocument();
  });

  it("navigates to login page when sign in button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const signInButton = screen.getByRole("button", { name: /sign in to get started/i });
    await user.click(signInButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("navigates to explore page when explore link is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const exploreButton = screen.getByRole("button", { name: /explore page/i });
    await user.click(exploreButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/explore");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders user icon", () => {
    const { container } = renderComponent();
    
    expect(container.querySelector(".guest-icon")).toBeInTheDocument();
  });

  it("renders sign in button with login icon", () => {
    renderComponent();
    
    const signInButton = screen.getByRole("button", { name: /sign in to get started/i });
    expect(signInButton).toBeInTheDocument();
  });

  it("displays explore text correctly", () => {
    renderComponent();
    
    expect(screen.getByText(/or continue exploring public trips on the/i)).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = renderComponent();
    
    expect(container.querySelector(".guest-empty-state")).toBeInTheDocument();
    expect(container.querySelector(".guest-empty-card")).toBeInTheDocument();
    expect(container.querySelector(".guest-message")).toBeInTheDocument();
    expect(container.querySelector(".guest-features")).toBeInTheDocument();
    expect(container.querySelector(".guest-signin-btn")).toBeInTheDocument();
    expect(container.querySelector(".guest-explore-text")).toBeInTheDocument();
    expect(container.querySelector(".explore-link")).toBeInTheDocument();
  });

  it("renders with custom title and description", () => {
    renderComponent({
      title: "Custom Title",
      description: "Custom Description",
    });
    
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom Description")).toBeInTheDocument();
  });
});