import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AccuracyRing } from "@/components/accuracy-ring";

afterEach(cleanup);

describe("AccuracyRing", () => {
  it("renders percentage value", () => {
    render(<AccuracyRing value={0.95} label="Accuracy" />);
    expect(screen.getByText("95%")).toBeDefined();
  });

  it("renders label", () => {
    render(<AccuracyRing value={0.8} label="Routing Accuracy" />);
    expect(screen.getByText("Routing Accuracy")).toBeDefined();
  });

  it("renders 0% for zero value", () => {
    render(<AccuracyRing value={0} label="Empty" />);
    expect(screen.getByText("0%")).toBeDefined();
  });

  it("renders 100% for full value", () => {
    render(<AccuracyRing value={1} label="Perfect" />);
    expect(screen.getByText("100%")).toBeDefined();
  });

  it("renders SVG element", () => {
    const { container } = render(
      <AccuracyRing value={0.5} label="Test" />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });

  it("applies green color for high accuracy", () => {
    const { container } = render(
      <AccuracyRing value={0.95} label="High" />
    );
    const circles = container.querySelectorAll("circle");
    expect(circles[1].classList.contains("stroke-green-400")).toBe(true);
  });

  it("applies amber color for medium accuracy", () => {
    const { container } = render(
      <AccuracyRing value={0.75} label="Medium" />
    );
    const circles = container.querySelectorAll("circle");
    expect(circles[1].classList.contains("stroke-amber-400")).toBe(true);
  });

  it("applies red color for low accuracy", () => {
    const { container } = render(
      <AccuracyRing value={0.5} label="Low" />
    );
    const circles = container.querySelectorAll("circle");
    expect(circles[1].classList.contains("stroke-red-400")).toBe(true);
  });
});
