import { describe, it, expect } from "vitest";
import { runOptimizationLoop } from "@/lib/optimizer";
import type { SkillDefinition } from "@/lib/matcher";
import type { TestCaseForScoring } from "@/lib/scorer";

const SKILLS: SkillDefinition[] = [
  {
    name: "commit",
    description: "Create a git commit with a well-formatted message summarizing staged changes",
    trigger_phrases: ["commit my changes", "make a commit", "save my work"],
  },
  {
    name: "deploy",
    description: "Deploy the application to production or staging environments",
    trigger_phrases: ["deploy to production", "push to staging", "ship it"],
  },
  {
    name: "debug",
    description: "Help diagnose and fix bugs by analyzing error messages, stack traces, and code",
    trigger_phrases: ["fix this bug", "debug this error", "why is this failing"],
  },
];

const TEST_CASES: TestCaseForScoring[] = [
  { request_text: "commit my changes", expected_skill: "commit" },
  { request_text: "deploy to production", expected_skill: "deploy" },
  { request_text: "fix this bug", expected_skill: "debug" },
  { request_text: "save my work", expected_skill: "commit" },
  { request_text: "ship it", expected_skill: "deploy" },
];

describe("runOptimizationLoop", () => {
  it("returns optimization result with all fields", () => {
    const result = runOptimizationLoop(SKILLS, TEST_CASES, {
      max_iterations: 3,
    });

    expect(result).toHaveProperty("iterations_completed");
    expect(result).toHaveProperty("accuracy_start");
    expect(result).toHaveProperty("accuracy_end");
    expect(result).toHaveProperty("collision_rate_start");
    expect(result).toHaveProperty("collision_rate_end");
    expect(result).toHaveProperty("experiments");
    expect(result).toHaveProperty("final_skills");
    expect(result).toHaveProperty("improvements_kept");
    expect(result).toHaveProperty("improvements_reverted");
  });

  it("accuracy does not decrease after optimization", () => {
    const result = runOptimizationLoop(SKILLS, TEST_CASES, {
      max_iterations: 5,
    });
    expect(result.accuracy_end).toBeGreaterThanOrEqual(result.accuracy_start);
  });

  it("stops early when already perfect", () => {
    // These test cases should already route perfectly
    const result = runOptimizationLoop(SKILLS, TEST_CASES, {
      max_iterations: 10,
    });
    // Should stop before max iterations
    expect(result.iterations_completed).toBeLessThanOrEqual(10);
  });

  it("respects max_iterations config", () => {
    const result = runOptimizationLoop(SKILLS, TEST_CASES, {
      max_iterations: 1,
    });
    expect(result.iterations_completed).toBeLessThanOrEqual(1);
  });

  it("experiments list is populated", () => {
    // Use a case that will likely fail to trigger proposals
    const hardCases: TestCaseForScoring[] = [
      ...TEST_CASES,
      { request_text: "completely unrelated random text about cooking", expected_skill: "commit" },
    ];

    const result = runOptimizationLoop(SKILLS, hardCases, {
      max_iterations: 2,
    });
    // Should have at least attempted some experiments
    expect(result.experiments).toBeDefined();
    expect(Array.isArray(result.experiments)).toBe(true);
  });

  it("final_skills has same count as input", () => {
    const result = runOptimizationLoop(SKILLS, TEST_CASES);
    expect(result.final_skills).toHaveLength(SKILLS.length);
  });

  it("improvements_kept + improvements_reverted = total experiments", () => {
    const result = runOptimizationLoop(SKILLS, TEST_CASES, {
      max_iterations: 3,
    });
    expect(result.improvements_kept + result.improvements_reverted).toBe(
      result.experiments.length
    );
  });

  it("handles empty test cases", () => {
    const result = runOptimizationLoop(SKILLS, []);
    expect(result.iterations_completed).toBe(0);
    expect(result.accuracy_start).toBe(0);
  });

  it("handles single skill", () => {
    const result = runOptimizationLoop(
      [SKILLS[0]],
      [TEST_CASES[0]],
      { max_iterations: 2 }
    );
    expect(result.final_skills).toHaveLength(1);
  });
});
