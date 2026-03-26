import { describe, it, expect } from "vitest";
import {
  analyzeCollisions,
  type SkillForCollision,
  type Severity,
} from "@/lib/collision";

// The 7 fixture skills
const SKILLS: SkillForCollision[] = [
  {
    name: "commit",
    description: "Create a git commit with a well-formatted message summarizing staged changes",
    trigger_phrases: ["commit my changes", "make a commit", "save my work"],
  },
  {
    name: "review-pr",
    description: "Review a GitHub pull request for code quality, bugs, and style issues",
    trigger_phrases: ["review this PR", "check the pull request", "code review"],
  },
  {
    name: "debug",
    description: "Help diagnose and fix bugs by analyzing error messages, stack traces, and code",
    trigger_phrases: ["fix this bug", "debug this error", "why is this failing"],
  },
  {
    name: "refactor",
    description: "Refactor code for better readability, performance, or maintainability",
    trigger_phrases: ["clean up this code", "refactor this function", "improve code quality"],
  },
  {
    name: "test-writer",
    description: "Write unit tests, integration tests, or end-to-end tests for existing code",
    trigger_phrases: ["write tests for this", "add test coverage", "create unit tests"],
  },
  {
    name: "explain",
    description: "Explain how a piece of code works, what it does, and why it was written that way",
    trigger_phrases: ["explain this code", "what does this do", "walk me through this"],
  },
  {
    name: "deploy",
    description: "Deploy the application to production or staging environments",
    trigger_phrases: ["deploy to production", "push to staging", "ship it"],
  },
];

// Intentionally high-overlap skill pair for testing
const OVERLAPPING_SKILLS: SkillForCollision[] = [
  {
    name: "code-review",
    description: "Review code changes for quality, bugs, and style issues in pull requests",
    trigger_phrases: ["review this code", "check code quality", "code review"],
  },
  {
    name: "pr-reviewer",
    description: "Review pull request code for quality, bugs, and style issues",
    trigger_phrases: ["review this PR", "check code quality", "review pull request"],
  },
];

// Completely distinct skills
const DISTINCT_SKILLS: SkillForCollision[] = [
  {
    name: "weather",
    description: "Get the current weather forecast for any city or region",
    trigger_phrases: ["what's the weather", "forecast for today"],
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations and unit conversions",
    trigger_phrases: ["calculate this", "convert units"],
  },
];

describe("analyzeCollisions — basic structure", () => {
  it("returns correct total pairs count", () => {
    const result = analyzeCollisions(SKILLS, "lib-1");
    // 7 choose 2 = 21 pairs
    expect(result.total_pairs).toBe(21);
  });

  it("returns library_id in result", () => {
    const result = analyzeCollisions(SKILLS, "lib-test");
    expect(result.library_id).toBe("lib-test");
  });

  it("severity counts sum to total pairs", () => {
    const result = analyzeCollisions(SKILLS, "lib-1");
    const sum =
      result.critical_count +
      result.high_count +
      result.medium_count +
      result.low_count +
      result.clean_count;
    expect(sum).toBe(result.total_pairs);
  });

  it("pairs are sorted by overlap_pct descending", () => {
    const result = analyzeCollisions(SKILLS, "lib-1");
    for (let i = 1; i < result.collision_pairs.length; i++) {
      expect(result.collision_pairs[i - 1].overlap_pct).toBeGreaterThanOrEqual(
        result.collision_pairs[i].overlap_pct
      );
    }
  });

  it("each pair has required fields", () => {
    const result = analyzeCollisions(SKILLS, "lib-1");
    for (const pair of result.collision_pairs) {
      expect(pair).toHaveProperty("skill_a");
      expect(pair).toHaveProperty("skill_b");
      expect(pair).toHaveProperty("overlap_pct");
      expect(pair).toHaveProperty("shared_keywords");
      expect(pair).toHaveProperty("shared_triggers");
      expect(pair).toHaveProperty("severity");
      expect(pair).toHaveProperty("recommendation");
      expect(pair.overlap_pct).toBeGreaterThanOrEqual(0);
      expect(pair.overlap_pct).toBeLessThanOrEqual(100);
    }
  });
});

describe("analyzeCollisions — high overlap detection", () => {
  it("detects high overlap between near-duplicate skills", () => {
    const result = analyzeCollisions(OVERLAPPING_SKILLS, "lib-overlap");
    expect(result.collision_pairs).toHaveLength(1);
    const pair = result.collision_pairs[0];
    expect(pair.overlap_pct).toBeGreaterThan(30);
    expect(["CRITICAL", "HIGH"]).toContain(pair.severity);
  });

  it("finds shared keywords between overlapping skills", () => {
    const result = analyzeCollisions(OVERLAPPING_SKILLS, "lib-overlap");
    const pair = result.collision_pairs[0];
    expect(pair.shared_keywords.length).toBeGreaterThan(0);
  });

  it("finds shared triggers between overlapping skills", () => {
    const result = analyzeCollisions(OVERLAPPING_SKILLS, "lib-overlap");
    const pair = result.collision_pairs[0];
    expect(pair.shared_triggers.length).toBeGreaterThan(0);
    expect(pair.shared_triggers).toContain("check code quality");
  });

  it("generates merge recommendation for critical pairs", () => {
    const result = analyzeCollisions(OVERLAPPING_SKILLS, "lib-overlap");
    const pair = result.collision_pairs[0];
    if (pair.severity === "CRITICAL") {
      expect(pair.recommendation).toContain("merging");
    } else {
      expect(pair.recommendation).toContain("Tighten");
    }
  });
});

describe("analyzeCollisions — low/zero overlap", () => {
  it("detects zero or very low overlap between distinct skills", () => {
    const result = analyzeCollisions(DISTINCT_SKILLS, "lib-distinct");
    const pair = result.collision_pairs[0];
    expect(pair.overlap_pct).toBeLessThan(15);
  });

  it("classifies low overlap as LOW severity", () => {
    const result = analyzeCollisions(DISTINCT_SKILLS, "lib-distinct");
    const pair = result.collision_pairs[0];
    expect(pair.severity).toBe("LOW");
  });

  it("has few or no shared keywords for distinct skills", () => {
    const result = analyzeCollisions(DISTINCT_SKILLS, "lib-distinct");
    const pair = result.collision_pairs[0];
    expect(pair.shared_keywords.length).toBeLessThanOrEqual(1);
  });
});

describe("analyzeCollisions — fixture library analysis", () => {
  const result = analyzeCollisions(SKILLS, "lib-fixture");

  it("no CRITICAL collisions in well-designed fixture library", () => {
    expect(result.critical_count).toBe(0);
  });

  it("overall collision score is moderate or low", () => {
    expect(result.overall_collision_score).toBeLessThan(50);
  });

  it("review-pr and refactor have some overlap (both mention code quality)", () => {
    const pair = result.collision_pairs.find(
      (p) =>
        (p.skill_a === "review-pr" && p.skill_b === "refactor") ||
        (p.skill_a === "refactor" && p.skill_b === "review-pr")
    );
    expect(pair).toBeDefined();
    expect(pair!.overlap_pct).toBeGreaterThan(0);
  });

  it("commit and deploy have minimal overlap", () => {
    const pair = result.collision_pairs.find(
      (p) =>
        (p.skill_a === "commit" && p.skill_b === "deploy") ||
        (p.skill_a === "deploy" && p.skill_b === "commit")
    );
    expect(pair).toBeDefined();
    expect(pair!.overlap_pct).toBeLessThan(20);
  });

  it("debug and explain have some overlap (both analyze code)", () => {
    const pair = result.collision_pairs.find(
      (p) =>
        (p.skill_a === "debug" && p.skill_b === "explain") ||
        (p.skill_a === "explain" && p.skill_b === "debug")
    );
    expect(pair).toBeDefined();
    expect(pair!.overlap_pct).toBeGreaterThan(0);
  });
});

describe("analyzeCollisions — edge cases", () => {
  it("handles empty skills array", () => {
    const result = analyzeCollisions([], "lib-empty");
    expect(result.total_pairs).toBe(0);
    expect(result.collision_pairs).toEqual([]);
    expect(result.overall_collision_score).toBe(0);
  });

  it("handles single skill (no pairs possible)", () => {
    const result = analyzeCollisions([SKILLS[0]], "lib-one");
    expect(result.total_pairs).toBe(0);
  });

  it("handles skills with no trigger phrases", () => {
    const noTriggers: SkillForCollision[] = [
      { name: "a", description: "Do something with files", trigger_phrases: [] },
      { name: "b", description: "Do something else with data", trigger_phrases: [] },
    ];
    const result = analyzeCollisions(noTriggers, "lib-notrig");
    expect(result.total_pairs).toBe(1);
    expect(result.collision_pairs[0].trigger_overlap).toBe(0);
  });

  it("handles skills with empty descriptions", () => {
    const empty: SkillForCollision[] = [
      { name: "a", description: "", trigger_phrases: ["test"] },
      { name: "b", description: "", trigger_phrases: ["test"] },
    ];
    const result = analyzeCollisions(empty, "lib-empty-desc");
    expect(result.total_pairs).toBe(1);
    // Should still detect shared trigger
    expect(result.collision_pairs[0].trigger_overlap).toBeGreaterThan(0);
  });
});

describe("severity classification", () => {
  it("overlap >50% is CRITICAL", () => {
    const skills: SkillForCollision[] = [
      {
        name: "a",
        description: "review code quality bugs style",
        trigger_phrases: ["review code", "check quality", "fix bugs"],
      },
      {
        name: "b",
        description: "review code quality bugs style",
        trigger_phrases: ["review code", "check quality", "fix bugs"],
      },
    ];
    const result = analyzeCollisions(skills, "test");
    expect(result.collision_pairs[0].severity).toBe("CRITICAL");
    expect(result.collision_pairs[0].overlap_pct).toBeGreaterThan(50);
  });
});
