import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { TestCaseRow } from "@/components/test-case-row";

afterEach(cleanup);

const defaultProps = {
  id: "tc-1",
  request_text: "commit my changes",
  expected_skill: "commit",
  expected_supporting: ["git"],
  should_not_trigger: ["deploy"],
  difficulty: "medium",
  cluster_tag: "git-ops",
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
};

function renderRow(overrides = {}) {
  return render(
    <table>
      <tbody>
        <TestCaseRow {...defaultProps} {...overrides} />
      </tbody>
    </table>
  );
}

describe("TestCaseRow", () => {
  it("renders test case data in view mode", () => {
    renderRow();
    expect(screen.getByText("commit my changes")).toBeDefined();
    expect(screen.getByText("commit")).toBeDefined();
    expect(screen.getByText("medium")).toBeDefined();
    expect(screen.getByText("git-ops")).toBeDefined();
  });

  it("shows dash for null cluster_tag", () => {
    renderRow({ cluster_tag: null });
    expect(screen.getByText("—")).toBeDefined();
  });

  it("switches to edit mode on Edit click", () => {
    renderRow();
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Save")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("calls onDelete when Delete clicked", () => {
    const onDelete = vi.fn();
    renderRow({ onDelete });
    fireEvent.click(screen.getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("tc-1");
  });

  it("calls onUpdate with edited data on Save", () => {
    const onUpdate = vi.fn();
    renderRow({ onUpdate });
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Save"));
    expect(onUpdate).toHaveBeenCalledWith(
      "tc-1",
      expect.objectContaining({
        request_text: "commit my changes",
        expected_skill: "commit",
      })
    );
  });

  it("reverts to view mode on Cancel", () => {
    renderRow();
    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Save")).toBeDefined();
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Edit")).toBeDefined();
  });

  it("applies correct color for easy difficulty", () => {
    renderRow({ difficulty: "easy" });
    const el = screen.getByText("easy");
    expect(el.className).toContain("text-green-400");
  });

  it("applies correct color for hard difficulty", () => {
    renderRow({ difficulty: "hard" });
    const el = screen.getByText("hard");
    expect(el.className).toContain("text-red-400");
  });
});
