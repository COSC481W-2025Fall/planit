import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import TripPage from "../pages/TripPage";
import * as tripsApi from "../../api/trips";
import { MemoryRouter } from "react-router-dom";


describe("TripPage", () => {
 beforeEach(() => {
   vi.restoreAllMocks();


   // Mock fetch for login details
   global.fetch = vi.fn((url) => {
     if (url.includes("/auth/login/details")) {
       return Promise.resolve({
         json: () =>
           //mock results for trip details
           Promise.resolve({
             loggedIn: true,
             user_id: 1,
             first_name: "Test",
             last_name: "User",
           }),
       });
     }
     return Promise.reject(new Error("Unhandled fetch: " + url));
   });
 });


 test("renders loading state before user is loaded", () => {
   render(
     <MemoryRouter>
       <TripPage />
     </MemoryRouter>
   );


   const loadings = screen.getAllByText(/loading.../i);
   expect(loadings).toHaveLength(2);  });


 test("shows empty state when no trips exist", async () => {
   vi.spyOn(tripsApi, "getTrips").mockResolvedValue([]);


   render(
     <MemoryRouter>
       <TripPage />
     </MemoryRouter>
   );


   await waitFor(() => {
     expect(screen.getByText(/No trips yet!/i)).toBeInTheDocument();
     expect(
       screen.getByText(/Test, you haven't created any trips!/i)
     ).toBeInTheDocument();
   });
 });


 test("renders trips when available", async () => {
   vi.spyOn(tripsApi, "getTrips").mockResolvedValue([
     {
       trips_id: 101,
       trip_name: "Hawaii",
       trip_location: "Honolulu",
       days: 5,
     },
   ]);


   render(
     <MemoryRouter>
       <TripPage />
     </MemoryRouter>
   );


   await waitFor(() => {
     expect(screen.getByText("Hawaii")).toBeInTheDocument();
     expect(screen.getByText("Honolulu")).toBeInTheDocument();
     expect(screen.getByText(/5 days/i)).toBeInTheDocument();
   });
 });


 test("opens modal when + New Trip is clicked", async () => {
   vi.spyOn(tripsApi, "getTrips").mockResolvedValue([]);


   render(
     <MemoryRouter>
       <TripPage />
     </MemoryRouter>
   );


   // wait until empty state renders
   await waitFor(() => screen.getByText(/No trips yet!/i));


   fireEvent.click(screen.getByText(/\+ New Trip/i));


   expect(screen.getByText(/Create New Trip/i)).toBeInTheDocument();
   expect(screen.getByPlaceholderText(/Trip Name/i)).toBeInTheDocument();
 });


 test("deletes a trip when Delete is clicked", async () => {
   vi.spyOn(tripsApi, "getTrips").mockResolvedValue([
     { trips_id: 123, trip_name: "Paris", trip_location: "France", days: 3 },
   ]);
   vi.spyOn(tripsApi, "deleteTrip").mockResolvedValue();


   // confirm dialog mock
   vi.spyOn(window, "confirm").mockReturnValue(true);


   render(
     <MemoryRouter>
       <TripPage />
     </MemoryRouter>
   );


   await waitFor(() => screen.getByText("Paris"));


   fireEvent.click(screen.getByText("⋮")); // open dropdown
   fireEvent.click(screen.getByText(/Delete Trip/i));


   await waitFor(() =>
     expect(tripsApi.deleteTrip).toHaveBeenCalledWith(123)
   );
 });
});
