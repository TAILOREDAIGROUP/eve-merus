import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Sparkline } from "@/components/sparkline";

afterEach(cleanup);

describe("Sparkline", () => {
  it("renders SVG with polyline for valid data", () => {
    const { container } = render(<Sparkline data={[50, 60, 70, 80]} />);
    expect(container.querySelector("svg")).toBeDefined();
    expect(container.querySelector("polyline")).toBeDefined();
  });

  it("shows 'Not enough data' for single point", () => {
    render(<Sparkline data={[50]} />);
    expect(screen.getByText("Not enough data")).toBeDefined();
  });

  it("shows positive trend indicator", () => {
    render(<Sparkline data={[50, 80]} />);
    expect(screen.getByText("+30")).toBeDefined();
  });

  it("shows negative trend indicator", () => {
    render(<Sparkline data={[80, 50]} />);
    expect(screen.getByText("-30")).toBeDefined();
  });

  it("renders end-point circle", () => {
    const { container } = render(<Sparkline data={[50, 60, 70]} />);
    expect(container.querySelector("circle")).toBeDefined();
  });
});
