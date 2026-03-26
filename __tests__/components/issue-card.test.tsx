import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { IssueCard } from "@/components/issue-card";

afterEach(cleanup);

describe("IssueCard", () => {
  it("renders title and detail", () => {
    render(
      <IssueCard
        type="collision"
        title="commit ↔ debug"
        detail="25% overlap"
      />
    );
    expect(screen.getByText("commit ↔ debug")).toBeDefined();
    expect(screen.getByText("25% overlap")).toBeDefined();
  });

  it("renders action link when provided", () => {
    render(
      <IssueCard
        type="routing"
        title="Test"
        detail="Detail"
        action="Fix this →"
      />
    );
    expect(screen.getByText("Fix this →")).toBeDefined();
  });

  it("renders icon for collision type", () => {
    render(
      <IssueCard type="collision" title="Test" detail="Detail" />
    );
    expect(screen.getByText("!!")).toBeDefined();
  });

  it("renders icon for routing type", () => {
    render(
      <IssueCard type="routing" title="Test" detail="Detail" />
    );
    expect(screen.getByText("?")).toBeDefined();
  });
});
