import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CloneTripButton from "../components/CloneTripButton.jsx";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe("CloneTripButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when fromExplore=false", () => {
    render(
      <CloneTripButton
        user={{ user_id: 1 }}
        tripId={1}
        access="owner"
        fromExplore={false}
        onCloned={() => {}}
        trip={{ trip_name: "Trip A" }}
      />
    );

    expect(screen.queryByText("Clone Trip")).toBeNull();
  });

  it("should show toast error for guest user", async () => {
    render(
      <CloneTripButton
        user={{ user_id: "guest_123" }}
        tripId={1}
        access="viewer"
        fromExplore={true}
        onCloned={() => {}}
        trip={{ trip_name: "Trip A" }}
      />
    );

    fireEvent.click(screen.getByText("Clone Trip"));

    expect(toast.error).toHaveBeenCalledWith("Login to clone this trip.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should fetch dayCount and open modal", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ dayCount: 4 }),
    });

    render(
      <CloneTripButton
        user={{ user_id: 1 }}
        tripId={1}
        access="editor"
        fromExplore={true}
        onCloned={() => {}}
        trip={{ trip_name: "Trip A" }}
      />
    );

    fireEvent.click(screen.getByText("Clone Trip"));

    await waitFor(() =>
      expect(
        screen.getByText(/This trip is\s*4\s*day/i)
      ).toBeInTheDocument()
    );
  });

  it("should clone trip successfully", async () => {
    const mockOnCloned = vi.fn();

    fetch.mockResolvedValueOnce({
      json: async () => ({ dayCount: 4 }),
    });

    fetch.mockResolvedValueOnce({
      json: async () => ({ ok: true, newTripId: 99 }),
    });

    render(
      <CloneTripButton
        user={{ user_id: 1 }}
        tripId={1}
        access="editor"
        fromExplore={true}
        onCloned={mockOnCloned}
        trip={{ trip_name: "Trip A" }}
      />
    );

    fireEvent.click(screen.getByText("Clone Trip"));

    await screen.findByText(/This trip is\s*4\s*day/i)

    const datePicker = screen.getByPlaceholderText("Choose Start Date");
    fireEvent.change(datePicker, { target: { value: "01-05-2025" } });

    fireEvent.click(screen.getByText("Clone"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Trip cloned successfully!");
    });

    await waitFor(() => {
      expect(mockOnCloned).toHaveBeenCalledWith(99);
    });
  });

  it("should show error toast if cloning fails", async () => {
    const mockOnCloned = vi.fn();

    fetch.mockResolvedValueOnce({
      json: async () => ({ dayCount: 4 }),
    });

    fetch.mockResolvedValueOnce({
      json: async () => ({ ok: false }),
    });

    render(
      <CloneTripButton
        user={{ user_id: 1 }}
        tripId={1}
        access="editor"
        fromExplore={true}
        onCloned={mockOnCloned}
        trip={{ trip_name: "Trip A" }}
      />
    );

    fireEvent.click(screen.getByText("Clone Trip"));

    await screen.findByText(/This trip is\s*4\s*day/i)

    const datePicker = screen.getByPlaceholderText("Choose Start Date");
    fireEvent.change(datePicker, { target: { value: "01-05-2025" } });

    fireEvent.click(screen.getByText("Clone"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to clone trip.")
    );

    expect(mockOnCloned).not.toHaveBeenCalled();
  });
});
