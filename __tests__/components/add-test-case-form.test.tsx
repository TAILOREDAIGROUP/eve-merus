import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AddTestCaseForm } from "@/components/add-test-case-form";

afterEach(cleanup);

describe("AddTestCaseForm", () => {
  it("renders add button initially", () => {
    render(<AddTestCaseForm onAdd={vi.fn()} />);
    expect(screen.getByText("+ Add Test Case")).toBeDefined();
  });

  it("shows form when button clicked", () => {
    render(<AddTestCaseForm onAdd={vi.fn()} />);
    fireEvent.click(screen.getByText("+ Add Test Case"));
    expect(screen.getByText("Add Case")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("hides form on Cancel", () => {
    render(<AddTestCaseForm onAdd={vi.fn()} />);
    fireEvent.click(screen.getByText("+ Add Test Case"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("+ Add Test Case")).toBeDefined();
  });

  it("calls onAdd with form data", () => {
    const onAdd = vi.fn();
    render(<AddTestCaseForm onAdd={onAdd} />);
    fireEvent.click(screen.getByText("+ Add Test Case"));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "commit changes" } });
    fireEvent.change(inputs[1], { target: { value: "commit" } });

    fireEvent.click(screen.getByText("Add Case"));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        request_text: "commit changes",
        expected_skill: "commit",
        difficulty: "medium",
      })
    );
  });

  it("resets form after successful add", () => {
    const onAdd = vi.fn();
    render(<AddTestCaseForm onAdd={onAdd} />);
    fireEvent.click(screen.getByText("+ Add Test Case"));

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "test" } });
    fireEvent.change(inputs[1], { target: { value: "skill" } });
    fireEvent.click(screen.getByText("Add Case"));

    expect((inputs[0] as HTMLInputElement).value).toBe("");
  });
});
