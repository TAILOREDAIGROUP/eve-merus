import { describe, it, expect } from "vitest";
import { exportExperimentsToTsv, type ExperimentRow } from "@/lib/export";

const EXPERIMENTS: ExperimentRow[] = [
  {
    id: "exp-1",
    change_type: "add_trigger_phrases",
    old_description: "Create a git commit",
    new_description: "Create a git commit. Also handles: save, persist",
    accuracy_before: 0.8,
    accuracy_after: 0.9,
    collision_rate_before: 0.1,
    collision_rate_after: 0.05,
    kept: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "exp-2",
    change_type: "sharpen_description",
    old_description: "Deploy the application",
    new_description: "Specifically for deployment. Deploy the application",
    accuracy_before: 0.9,
    accuracy_after: 0.85,
    collision_rate_before: 0.05,
    collision_rate_after: 0.1,
    kept: false,
    created_at: "2026-01-01T00:01:00Z",
  },
];

describe("exportExperimentsToTsv", () => {
  it("produces valid TSV with header row", () => {
    const tsv = exportExperimentsToTsv(EXPERIMENTS);
    const lines = tsv.split("\n");
    expect(lines.length).toBe(3); // header + 2 data rows
    expect(lines[0]).toContain("experiment_id");
    expect(lines[0]).toContain("accuracy_before");
  });

  it("columns are tab-separated", () => {
    const tsv = exportExperimentsToTsv(EXPERIMENTS);
    const headerCols = tsv.split("\n")[0].split("\t");
    expect(headerCols).toHaveLength(11);
  });

  it("includes experiment IDs", () => {
    const tsv = exportExperimentsToTsv(EXPERIMENTS);
    expect(tsv).toContain("exp-1");
    expect(tsv).toContain("exp-2");
  });

  it("shows YES/NO for kept column", () => {
    const tsv = exportExperimentsToTsv(EXPERIMENTS);
    expect(tsv).toContain("YES");
    expect(tsv).toContain("NO");
  });

  it("includes accuracy deltas with sign", () => {
    const tsv = exportExperimentsToTsv(EXPERIMENTS);
    expect(tsv).toContain("+0.1000"); // exp-1 accuracy delta
    expect(tsv).toContain("-0.0500"); // exp-2 accuracy delta
  });

  it("handles empty experiments", () => {
    const tsv = exportExperimentsToTsv([]);
    const lines = tsv.split("\n");
    expect(lines).toHaveLength(1); // header only
  });

  it("escapes tabs and newlines in descriptions", () => {
    const exp: ExperimentRow = {
      ...EXPERIMENTS[0],
      old_description: "has\ttab\nand newline",
      new_description: "clean",
    };
    const tsv = exportExperimentsToTsv([exp]);
    // Should not have extra tabs (would break TSV)
    const dataCols = tsv.split("\n")[1].split("\t");
    expect(dataCols).toHaveLength(11);
  });

  it("handles null collision rates", () => {
    const exp: ExperimentRow = {
      ...EXPERIMENTS[0],
      collision_rate_before: null,
      collision_rate_after: null,
    };
    const tsv = exportExperimentsToTsv([exp]);
    expect(tsv).toContain("0.0000"); // nulls default to 0
  });
});
