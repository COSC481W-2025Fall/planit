import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider.jsx";

// Small demo component that uses the theme context
function Demo() {
  const { theme, toggle, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setTheme("light")}>toLight</button>
      <button onClick={() => setTheme("dark")}>toDark</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Make sure each test starts clean
    localStorage.removeItem("theme");
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts as light by default and sets html attribute", () => {
    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>
    );

    // Context value shows "light"
    expect(screen.getByTestId("theme").textContent).toBe("light");

    // <html data-theme="light"> is applied
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // localStorage saved as "light"
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("toggles between light and dark", () => {
    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>
    );

    // Click toggle -> should become "dark"
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    // Toggle back -> "light"
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("respects a saved theme from localStorage", () => {
    // Pretend user previously chose dark
    localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>
    );

    // Should start dark
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("setTheme('light' | 'dark') works directly", () => {
    render(
      <ThemeProvider>
        <Demo />
      </ThemeProvider>
    );

    // Force dark
    fireEvent.click(screen.getByText("toDark"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Force light
    fireEvent.click(screen.getByText("toLight"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
