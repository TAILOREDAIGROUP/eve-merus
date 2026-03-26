import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImportJsonButton } from "@/components/import-json-button";

describe("ImportJsonButton", () => {
  it("renders import button", () => {
    render(<ImportJsonButton onImport={vi.fn()} />);
    expect(screen.getByText("Import JSON")).toBeDefined();
  });

  it("has a hidden file input", () => {
    const { container } = render(<ImportJsonButton onImport={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeDefined();
    expect(input?.className).toContain("hidden");
    expect(input?.getAttribute("accept")).toBe(".json");
  });
});
