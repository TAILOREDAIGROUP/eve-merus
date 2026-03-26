import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CollisionHeatmap } from "@/components/collision-heatmap";

afterEach(cleanup);

const SKILLS = ["commit", "debug", "deploy"];
const PAIRS = [
  {
    skill_a: "commit",
    skill_b: "debug",
    overlap_pct: 25,
    shared_keywords: ["code"],
    shared_triggers: [],
    severity: "MEDIUM",
    recommendation: "Add explicit routing keywords.",
  },
  {
    skill_a: "commit",
    skill_b: "deploy",
    overlap_pct: 5,
    shared_keywords: [],
    shared_triggers: [],
    severity: "LOW",
    recommendation: "Minor overlap.",
  },
  {
    skill_a: "debug",
    skill_b: "deploy",
    overlap_pct: 0,
    shared_keywords: [],
    shared_triggers: [],
    severity: "LOW",
    recommendation: "No overlap.",
  },
];

describe("CollisionHeatmap", () => {
  it("renders skill labels in header and rows", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    const labels = screen.getAllByText("commit");
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it("renders overlap percentages in cells (symmetric matrix)", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    // 25% appears twice (commit→debug and debug→commit)
    expect(screen.getAllByText("25%")).toHaveLength(2);
    expect(screen.getAllByText("5%")).toHaveLength(2);
    // 0% may appear more due to legend text
    expect(screen.getAllByText("0%").length).toBeGreaterThanOrEqual(2);
  });

  it("renders diagonal as dashes", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(3);
  });

  it("shows detail panel when cell clicked", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    const cells = screen.getAllByText("25%");
    fireEvent.click(cells[0]);
    expect(screen.getByText("commit ↔ debug")).toBeDefined();
  });

  it("shows shared keywords in detail panel", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    fireEvent.click(screen.getAllByText("25%")[0]);
    expect(screen.getByText("code")).toBeDefined();
  });

  it("closes detail panel", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    fireEvent.click(screen.getAllByText("25%")[0]);
    expect(screen.getByText("commit ↔ debug")).toBeDefined();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByText("commit ↔ debug")).toBeNull();
  });

  it("renders legend items", () => {
    render(<CollisionHeatmap skills={SKILLS} pairs={PAIRS} />);
    expect(screen.getByText(/Critical/)).toBeDefined();
    expect(screen.getByText(/High/)).toBeDefined();
  });
});
