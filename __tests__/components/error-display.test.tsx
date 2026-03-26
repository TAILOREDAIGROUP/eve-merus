import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ErrorDisplay } from "@/components/error-display";

afterEach(cleanup);

describe("ErrorDisplay", () => {
  it("renders error message", () => {
    render(<ErrorDisplay message="Connection failed" />);
    expect(screen.getByText("Connection failed")).toBeDefined();
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("shows retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} />);
    expect(screen.getByText("Try Again")).toBeDefined();
  });

  it("calls onRetry when button clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Try Again"));
    expect(onRetry).toHaveBeenCalled();
  });

  it("hides retry button when no handler", () => {
    render(<ErrorDisplay message="Error" />);
    expect(screen.queryByText("Try Again")).toBeNull();
  });
});
