import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Label from "../../src/components/Label.jsx";

describe("Label Component", () => {

    it("should render nothing if category is missing", () => {
        const { container } = render(<Label category={null} />);
        expect(container.firstChild).toBeNull();
    });

    it("should render a label with text", () => {
        render(<Label category="Adventure" />);
        expect(screen.getByText("Adventure")).toBeTruthy();
    });

    it("should apply the matching color style", () => {
        render(<Label category="Food" />);

        const wrapper = screen.getByText("Food").parentElement;
        const color = wrapper.style.color;

        expect(["#ea580c", "rgb(234, 88, 12)"]).toContain(color);
    });

    it("should allow extra className", () => {
        render(<Label category="Nature" className="tester" />);


        const wrapper = screen.getByText("Nature").parentElement;

        expect(wrapper.classList.contains("tester")).toBe(true);
    });

});