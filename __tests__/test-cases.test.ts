import { describe, it, expect } from "vitest";
import {
  validateTestCase,
  normalizeTestCaseInput,
  validateTestCaseBatch,
} from "@/lib/test-cases";

describe("validateTestCase", () => {
  it("accepts a valid test case with all fields", () => {
    const result = validateTestCase({
      request_text: "commit my changes",
      expected_skill: "commit",
      expected_supporting: ["git"],
      should_not_trigger: ["deploy"],
      difficulty: "easy",
      cluster_tag: "git-operations",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts minimal required fields only", () => {
    const result = validateTestCase({
      request_text: "commit my changes",
      expected_skill: "commit",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects missing request_text", () => {
    const result = validateTestCase({ expected_skill: "commit" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("request_text");
  });

  it("rejects missing expected_skill", () => {
    const result = validateTestCase({ request_text: "do something" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("expected_skill");
  });

  it("rejects null input", () => {
    const result = validateTestCase(null);
    expect(result.valid).toBe(false);
  });

  it("rejects non-object input", () => {
    const result = validateTestCase("string");
    expect(result.valid).toBe(false);
  });

  it("rejects invalid difficulty", () => {
    const result = validateTestCase({
      request_text: "test",
      expected_skill: "skill",
      difficulty: "impossible",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("difficulty");
  });

  it("accepts all valid difficulty levels", () => {
    for (const d of ["easy", "medium", "hard"]) {
      const result = validateTestCase({
        request_text: "test",
        expected_skill: "skill",
        difficulty: d,
      });
      expect(result.valid).toBe(true);
    }
  });

  it("rejects non-array expected_supporting", () => {
    const result = validateTestCase({
      request_text: "test",
      expected_skill: "skill",
      expected_supporting: "not-array",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects non-array should_not_trigger", () => {
    const result = validateTestCase({
      request_text: "test",
      expected_skill: "skill",
      should_not_trigger: "not-array",
    });
    expect(result.valid).toBe(false);
  });

  it("collects multiple errors", () => {
    const result = validateTestCase({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe("normalizeTestCaseInput", () => {
  it("trims whitespace and sets defaults", () => {
    const result = normalizeTestCaseInput({
      request_text: "  commit my changes  ",
      expected_skill: "  commit  ",
    });
    expect(result.request_text).toBe("commit my changes");
    expect(result.expected_skill).toBe("commit");
    expect(result.expected_supporting).toEqual([]);
    expect(result.should_not_trigger).toEqual([]);
    expect(result.difficulty).toBe("medium");
    expect(result.cluster_tag).toBeUndefined();
  });

  it("preserves provided optional fields", () => {
    const result = normalizeTestCaseInput({
      request_text: "test",
      expected_skill: "skill",
      expected_supporting: ["a"],
      should_not_trigger: ["b"],
      difficulty: "hard",
      cluster_tag: "group",
    });
    expect(result.expected_supporting).toEqual(["a"]);
    expect(result.should_not_trigger).toEqual(["b"]);
    expect(result.difficulty).toBe("hard");
    expect(result.cluster_tag).toBe("group");
  });
});

describe("validateTestCaseBatch", () => {
  it("separates valid and invalid cases", () => {
    const result = validateTestCaseBatch([
      { request_text: "good", expected_skill: "skill" },
      { request_text: "also good", expected_skill: "skill2" },
      { bad: "data" },
    ]);

    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].index).toBe(2);
  });

  it("returns empty arrays for empty input", () => {
    const result = validateTestCaseBatch([]);
    expect(result.valid).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("normalizes valid cases", () => {
    const result = validateTestCaseBatch([
      { request_text: "  padded  ", expected_skill: "  skill  " },
    ]);

    expect(result.valid[0].request_text).toBe("padded");
    expect(result.valid[0].expected_skill).toBe("skill");
    expect(result.valid[0].difficulty).toBe("medium");
  });
});
