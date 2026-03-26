import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { HealthGauge } from "@/components/health-gauge";

afterEach(cleanup);

describe("HealthGauge", () => {
  it("renders the score value", () => {
    render(<HealthGauge score={85} />);
    expect(screen.getByText("85")).toBeDefined();
  });

  it("shows 'Healthy' for scores >= 80", () => {
    render(<HealthGauge score={90} />);
    expect(screen.getByText("Healthy")).toBeDefined();
  });

  it("shows 'Fair' for scores 60-79", () => {
    render(<HealthGauge score={70} />);
    expect(screen.getByText("Fair")).toBeDefined();
  });

  it("shows 'Needs Work' for scores < 60", () => {
    render(<HealthGauge score={40} />);
    expect(screen.getByText("Needs Work")).toBeDefined();
  });

  it("renders SVG element", () => {
    const { container } = render(<HealthGauge score={50} />);
    expect(container.querySelector("svg")).toBeDefined();
  });

  it("applies green color for high score", () => {
    const { container } = render(<HealthGauge score={95} />);
    const text = screen.getByText("95");
    expect(text.className).toContain("text-green-400");
  });

  it("applies red color for low score", () => {
    const { container } = render(<HealthGauge score={30} />);
    const text = screen.getByText("30");
    expect(text.className).toContain("text-red-400");
  });
});
