import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { LoadingSkeleton, CardSkeleton, TableSkeleton } from "@/components/loading-skeleton";

afterEach(cleanup);

describe("LoadingSkeleton", () => {
  it("renders specified number of lines", () => {
    const { container } = render(<LoadingSkeleton lines={5} />);
    const skeletonLines = container.querySelectorAll(".h-4");
    expect(skeletonLines).toHaveLength(5);
  });

  it("has animate-pulse class", () => {
    const { container } = render(<LoadingSkeleton />);
    expect(container.firstElementChild?.className).toContain("animate-pulse");
  });
});

describe("CardSkeleton", () => {
  it("renders a skeleton card", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstElementChild?.className).toContain("animate-pulse");
  });
});

describe("TableSkeleton", () => {
  it("renders skeleton rows", () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const rows = container.querySelectorAll(".border-t");
    expect(rows).toHaveLength(3);
  });
});
