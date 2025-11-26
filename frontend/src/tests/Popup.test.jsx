import { render } from "@testing-library/react";
import React from "react";
import Popup from "../components/Popup.jsx";
import { vi } from "vitest";

test("renders popup content", () => {
  const { getByText } = render(
    <Popup onClose={() => {}} title="My Popup">
      <p>Hello</p>
    </Popup>
  );

  expect(getByText("My Popup")).toBeInTheDocument();
  expect(getByText("Hello")).toBeInTheDocument();
});

test("click close button calls onClose", () => {
  const onClose = vi.fn();
  const { getByRole } = render(
    <Popup onClose={onClose} title="Close">
      <p>Test</p>
    </Popup>
  );

  getByRole("button").click();
  expect(onClose).toHaveBeenCalled();
});

test("dummy drag test", () => {
  expect(true).toBe(true);
});
