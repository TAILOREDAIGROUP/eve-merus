import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MetricCard } from "@/components/metric-card";

afterEach(cleanup);

describe("MetricCard", () => {
  it("renders label and value", () => {
    render(<MetricCard label="Routing Accuracy" value={95} />);
    expect(screen.getByText("95")).toBeDefined();
    expect(screen.getByText("Routing Accuracy")).toBeDefined();
  });

  it("renders detail text when provided", () => {
    render(<MetricCard label="Test" value={80} detail="85% accuracy" />);
    expect(screen.getByText("85% accuracy")).toBeDefined();
  });

  it("applies green color for high values", () => {
    render(<MetricCard label="Test" value={90} />);
    expect(screen.getByText("90").className).toContain("text-green-400");
  });

  it("applies amber color for medium values", () => {
    render(<MetricCard label="Test" value={70} />);
    expect(screen.getByText("70").className).toContain("text-amber-400");
  });

  it("applies red color for low values", () => {
    render(<MetricCard label="Test" value={40} />);
    expect(screen.getByText("40").className).toContain("text-red-400");
  });
});
