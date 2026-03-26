import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { CollisionList } from "@/components/collision-list";

afterEach(cleanup);

const PAIRS = [
  {
    skill_a: "commit",
    skill_b: "debug",
    overlap_pct: 35,
    shared_keywords: ["code"],
    severity: "HIGH",
    recommendation: "Tighten trigger boundaries.",
  },
  {
    skill_a: "debug",
    skill_b: "deploy",
    overlap_pct: 0,
    shared_keywords: [],
    severity: "LOW",
    recommendation: "No overlap.",
  },
];

describe("CollisionList", () => {
  it("only shows pairs with overlap > 0", () => {
    render(<CollisionList pairs={PAIRS} />);
    expect(screen.getByText("35%")).toBeDefined();
    expect(screen.queryByText("0%")).toBeNull();
  });

  it("shows skill names", () => {
    render(<CollisionList pairs={PAIRS} />);
    expect(screen.getByText("commit")).toBeDefined();
    expect(screen.getByText("debug")).toBeDefined();
  });

  it("shows severity badge", () => {
    render(<CollisionList pairs={PAIRS} />);
    expect(screen.getByText("HIGH")).toBeDefined();
  });

  it("shows empty message when no collisions", () => {
    render(
      <CollisionList
        pairs={[{ ...PAIRS[1] }]}
      />
    );
    expect(screen.getByText(/No collisions detected/)).toBeDefined();
  });
});
