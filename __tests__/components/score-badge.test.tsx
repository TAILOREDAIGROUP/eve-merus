import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ScoreBadge } from "@/components/score-badge";

afterEach(cleanup);

describe("ScoreBadge", () => {
  it("renders CORRECT badge with green color", () => {
    render(<ScoreBadge type="correct" />);
    const badge = screen.getByText("CORRECT");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("text-green-400");
  });

  it("renders COLLISION badge with amber color", () => {
    render(<ScoreBadge type="collision" />);
    const badge = screen.getByText("COLLISION");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("text-amber-400");
  });

  it("renders WRONG badge with red color", () => {
    render(<ScoreBadge type="wrong" />);
    const badge = screen.getByText("WRONG");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("text-red-400");
  });

  it("renders MISS badge with red color", () => {
    render(<ScoreBadge type="miss" />);
    const badge = screen.getByText("MISS");
    expect(badge).toBeDefined();
    expect(badge.className).toContain("text-red-400");
  });
});
