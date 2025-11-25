import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import ActivityCard from "../components/ActivityCard";

describe("ActivityCard", () => {
    test("does not show price when activity_price is empty", () => {
        const activity = {
            activity_name: "Activity",
            //price emprty
            activity_price: "",
            activity_time: "10:00 AM",
            activity_location: "Test",
            activity_website: ""
        };

        render(<ActivityCard activity={activity} />);

        expect(screen.getByText("Activity")).toBeInTheDocument();

        expect(screen.queryByText(/\$/)).toBeNull();
    });

    test("does not show time when activity_time is empty", () => {
        const activity = {
            activity_name: "Activity",
            activity_price: "1",
            //time empty
            activity_time: "",
            activity_location: "Test",
            activity_website: ""
        };

        render(<ActivityCard activity={activity} />);
        expect(screen.queryByTestId("activity-time")).toBeNull();
    });


    test("does not show website link when activity_website is empty", () => {
        const activity = {
            activity_name: "Activity",
            activity_price: "1",
            activity_time: "10:00 AM",
            activity_location: "Test",
            //webiste empty
            activity_website: ""
        };

        render(<ActivityCard activity={activity} />);

        expect(screen.queryByText(/website/i)).toBeNull();
    });
});
