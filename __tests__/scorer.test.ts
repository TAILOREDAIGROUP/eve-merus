import { describe, it, expect } from "vitest";
import {
  scoreTestSet,
  classifyResult,
  type TestCaseForScoring,
} from "@/lib/scorer";
import type { SkillDefinition, MatchResult } from "@/lib/matcher";

const SKILLS: SkillDefinition[] = [
  {
    name: "commit",
    description:
      "Create a git commit with a well-formatted message summarizing staged changes",
    trigger_phrases: ["commit my changes", "make a commit", "save my work"],
  },
  {
    name: "review-pr",
    description:
      "Review a GitHub pull request for code quality, bugs, and style issues",
    trigger_phrases: ["review this PR", "check the pull request", "code review"],
  },
  {
    name: "debug",
    description:
      "Help diagnose and fix bugs by analyzing error messages, stack traces, and code",
    trigger_phrases: ["fix this bug", "debug this error", "why is this failing"],
  },
  {
    name: "refactor",
    description:
      "Refactor code for better readability, performance, or maintainability",
    trigger_phrases: [
      "clean up this code",
      "refactor this function",
      "improve code quality",
    ],
  },
  {
    name: "test-writer",
    description:
      "Write unit tests, integration tests, or end-to-end tests for existing code",
    trigger_phrases: [
      "write tests for this",
      "add test coverage",
      "create unit tests",
    ],
  },
  {
    name: "explain",
    description:
      "Explain how a piece of code works, what it does, and why it was written that way",
    trigger_phrases: [
      "explain this code",
      "what does this do",
      "walk me through this",
    ],
  },
  {
    name: "deploy",
    description: "Deploy the application to production or staging environments",
    trigger_phrases: ["deploy to production", "push to staging", "ship it"],
  },
];

// Golden test set matching the fixture
const GOLDEN_TESTS: TestCaseForScoring[] = [
  { request_text: "commit my changes with a good message", expected_skill: "commit" },
  { request_text: "review this pull request for bugs", expected_skill: "review-pr" },
  { request_text: "this function is throwing a null pointer exception", expected_skill: "debug" },
  { request_text: "clean up this spaghetti code", expected_skill: "refactor" },
  { request_text: "write unit tests for the auth module", expected_skill: "test-writer" },
  { request_text: "what does this regex do", expected_skill: "explain" },
  { request_text: "ship this to production", expected_skill: "deploy" },
  { request_text: "the API returns 500 when I send a POST request", expected_skill: "debug" },
  { request_text: "add test coverage for edge cases in the payment flow", expected_skill: "test-writer" },
  { request_text: "walk me through how this middleware chain works", expected_skill: "explain" },
];

describe("classifyResult", () => {
  it("returns 'miss' when no matches", () => {
    expect(classifyResult([], "commit")).toBe("miss");
  });

  it("returns 'correct' when expected skill is #1", () => {
    const matches: MatchResult[] = [
      { skill_name: "commit", score: 0.9, keyword_score: 0.5, trigger_score: 0.8, similarity_score: 0.3 },
      { skill_name: "debug", score: 0.2, keyword_score: 0.1, trigger_score: 0, similarity_score: 0.1 },
    ];
    expect(classifyResult(matches, "commit")).toBe("correct");
  });

  it("returns 'collision' when expected skill present but not #1", () => {
    const matches: MatchResult[] = [
      { skill_name: "debug", score: 0.9, keyword_score: 0.5, trigger_score: 0.8, similarity_score: 0.3 },
      { skill_name: "commit", score: 0.5, keyword_score: 0.3, trigger_score: 0.2, similarity_score: 0.1 },
    ];
    expect(classifyResult(matches, "commit")).toBe("collision");
  });

  it("returns 'wrong' when expected skill not in results", () => {
    const matches: MatchResult[] = [
      { skill_name: "debug", score: 0.9, keyword_score: 0.5, trigger_score: 0.8, similarity_score: 0.3 },
      { skill_name: "refactor", score: 0.3, keyword_score: 0.2, trigger_score: 0, similarity_score: 0.1 },
    ];
    expect(classifyResult(matches, "commit")).toBe("wrong");
  });
});

describe("scoreTestSet", () => {
  it("returns aggregate metrics", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);

    expect(result.total_cases).toBe(10);
    expect(result.correct_count + result.collision_count + result.wrong_count + result.miss_count).toBe(10);
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeLessThanOrEqual(1);
    expect(result.collision_rate).toBeGreaterThanOrEqual(0);
    expect(result.collision_rate).toBeLessThanOrEqual(1);
  });

  it("returns per-case results matching test count", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    expect(result.case_results).toHaveLength(10);
  });

  it("each case result has required fields", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    for (const cr of result.case_results) {
      expect(cr).toHaveProperty("request_text");
      expect(cr).toHaveProperty("expected_skill");
      expect(cr).toHaveProperty("result_type");
      expect(cr).toHaveProperty("triggered_skill");
      expect(cr).toHaveProperty("all_triggered");
      expect(cr).toHaveProperty("confidence");
      expect(["correct", "collision", "wrong", "miss"]).toContain(cr.result_type);
    }
  });

  it("achieves high accuracy on the golden test set", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    // We should get at least 80% accuracy with our matcher
    expect(result.accuracy).toBeGreaterThanOrEqual(0.8);
    // And low collision rate
    expect(result.collision_rate).toBeLessThanOrEqual(0.2);
  });

  it("accuracy + collision + wrong + miss rates sum to 1", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    const sum =
      result.correct_count +
      result.collision_count +
      result.wrong_count +
      result.miss_count;
    expect(sum).toBe(result.total_cases);
  });

  it("handles empty test set", () => {
    const result = scoreTestSet([], SKILLS);
    expect(result.total_cases).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.collision_rate).toBe(0);
  });

  it("handles empty skills", () => {
    const result = scoreTestSet(GOLDEN_TESTS, []);
    expect(result.total_cases).toBe(10);
    expect(result.miss_count).toBe(10);
    expect(result.accuracy).toBe(0);
  });

  it("correct results have triggered_skill matching expected", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    for (const cr of result.case_results) {
      if (cr.result_type === "correct") {
        expect(cr.triggered_skill).toBe(cr.expected_skill);
      }
    }
  });

  it("collision results have expected skill in all_triggered", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    for (const cr of result.case_results) {
      if (cr.result_type === "collision") {
        expect(cr.all_triggered).toContain(cr.expected_skill);
        expect(cr.triggered_skill).not.toBe(cr.expected_skill);
      }
    }
  });

  it("miss results have null triggered_skill", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    for (const cr of result.case_results) {
      if (cr.result_type === "miss") {
        expect(cr.triggered_skill).toBeNull();
        expect(cr.confidence).toBeNull();
      }
    }
  });

  it("all_triggered is sorted by score descending", () => {
    const result = scoreTestSet(GOLDEN_TESTS, SKILLS);
    for (const cr of result.case_results) {
      if (cr.match_details.length > 1) {
        for (let i = 1; i < cr.match_details.length; i++) {
          expect(cr.match_details[i - 1].score).toBeGreaterThanOrEqual(
            cr.match_details[i].score
          );
        }
      }
    }
  });
});

describe("scoreTestSet — detailed golden test results", () => {
  const result = scoreTestSet(GOLDEN_TESTS, SKILLS);

  it("routes 'commit my changes with a good message' correctly", () => {
    const cr = result.case_results[0];
    expect(cr.result_type).toBe("correct");
    expect(cr.triggered_skill).toBe("commit");
  });

  it("routes 'review this pull request for bugs' correctly", () => {
    const cr = result.case_results[1];
    expect(cr.result_type).toBe("correct");
    expect(cr.triggered_skill).toBe("review-pr");
  });

  it("routes 'write unit tests for the auth module' correctly", () => {
    const cr = result.case_results[4];
    expect(cr.result_type).toBe("correct");
    expect(cr.triggered_skill).toBe("test-writer");
  });

  it("routes 'ship this to production' correctly", () => {
    const cr = result.case_results[6];
    expect(cr.result_type).toBe("correct");
    expect(cr.triggered_skill).toBe("deploy");
  });
});
