import { describe, it, expect } from "vitest";
import {
  matchRequest,
  topMatch,
  tokenize,
  type SkillDefinition,
} from "@/lib/matcher";

// The 7 fixture skills from Slice 5
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
    trigger_phrases: [
      "review this PR",
      "check the pull request",
      "code review",
    ],
  },
  {
    name: "debug",
    description:
      "Help diagnose and fix bugs by analyzing error messages, stack traces, and code",
    trigger_phrases: [
      "fix this bug",
      "debug this error",
      "why is this failing",
    ],
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

describe("tokenize", () => {
  it("lowercases and splits on whitespace", () => {
    const tokens = tokenize("Hello World Test");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
    expect(tokens).toContain("test");
  });

  it("removes stop words", () => {
    const tokens = tokenize("this is a test of the system");
    expect(tokens).not.toContain("this");
    expect(tokens).not.toContain("is");
    expect(tokens).not.toContain("a");
    expect(tokens).not.toContain("the");
    expect(tokens).toContain("test");
    expect(tokens).toContain("system");
  });

  it("removes punctuation", () => {
    const tokens = tokenize("hello, world! test?");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
  });

  it("removes single-character tokens", () => {
    const tokens = tokenize("I a x test");
    expect(tokens).not.toContain("x");
    expect(tokens).toContain("test");
  });
});

describe("matchRequest", () => {
  it("returns empty for empty request", () => {
    expect(matchRequest("", SKILLS)).toEqual([]);
  });

  it("returns empty for empty skills", () => {
    expect(matchRequest("test", [])).toEqual([]);
  });

  it("returns results sorted by score descending", () => {
    const results = matchRequest("commit my changes", SKILLS);
    expect(results.length).toBeGreaterThan(0);

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("includes score breakdown fields", () => {
    const results = matchRequest("commit my changes", SKILLS);
    const top = results[0];
    expect(top).toHaveProperty("skill_name");
    expect(top).toHaveProperty("score");
    expect(top).toHaveProperty("keyword_score");
    expect(top).toHaveProperty("trigger_score");
    expect(top).toHaveProperty("similarity_score");
  });

  it("filters out zero-score skills", () => {
    const results = matchRequest("commit my changes", SKILLS);
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });
});

describe("topMatch — routing accuracy tests", () => {
  // ── Easy: exact trigger phrase matches ──

  it("routes 'commit my changes' → commit", () => {
    expect(topMatch("commit my changes", SKILLS)).toBe("commit");
  });

  it("routes 'review this PR' → review-pr", () => {
    expect(topMatch("review this PR", SKILLS)).toBe("review-pr");
  });

  it("routes 'fix this bug' → debug", () => {
    expect(topMatch("fix this bug", SKILLS)).toBe("debug");
  });

  it("routes 'clean up this code' → refactor", () => {
    expect(topMatch("clean up this code", SKILLS)).toBe("refactor");
  });

  it("routes 'write tests for this' → test-writer", () => {
    expect(topMatch("write tests for this", SKILLS)).toBe("test-writer");
  });

  it("routes 'explain this code' → explain", () => {
    expect(topMatch("explain this code", SKILLS)).toBe("explain");
  });

  it("routes 'deploy to production' → deploy", () => {
    expect(topMatch("deploy to production", SKILLS)).toBe("deploy");
  });

  // ── Medium: natural language variations ──

  it("routes 'save my work to git' → commit", () => {
    expect(topMatch("save my work to git", SKILLS)).toBe("commit");
  });

  it("routes 'check the pull request for issues' → review-pr", () => {
    expect(topMatch("check the pull request for issues", SKILLS)).toBe(
      "review-pr"
    );
  });

  it("routes 'why is this failing with a null error' → debug", () => {
    expect(topMatch("why is this failing with a null error", SKILLS)).toBe(
      "debug"
    );
  });

  it("routes 'add unit test coverage for the auth module' → test-writer", () => {
    expect(
      topMatch("add unit test coverage for the auth module", SKILLS)
    ).toBe("test-writer");
  });

  it("routes 'what does this function do' → explain", () => {
    expect(topMatch("what does this function do", SKILLS)).toBe("explain");
  });

  it("routes 'ship it to staging' → deploy", () => {
    expect(topMatch("ship it to staging", SKILLS)).toBe("deploy");
  });

  // ── Hard: ambiguous or indirect requests ──

  it("routes 'make this code cleaner and faster' → refactor", () => {
    expect(topMatch("make this code cleaner and faster", SKILLS)).toBe(
      "refactor"
    );
  });

  it("routes 'create unit tests for the payment service' → test-writer", () => {
    expect(
      topMatch("create unit tests for the payment service", SKILLS)
    ).toBe("test-writer");
  });

  it("routes 'do a code review on my branch' → review-pr", () => {
    expect(topMatch("do a code review on my branch", SKILLS)).toBe(
      "review-pr"
    );
  });

  it("routes 'debug this error message' → debug", () => {
    expect(topMatch("debug this error message", SKILLS)).toBe("debug");
  });

  it("routes 'push to staging environment' → deploy", () => {
    expect(topMatch("push to staging environment", SKILLS)).toBe("deploy");
  });

  it("routes 'walk me through this middleware' → explain", () => {
    expect(topMatch("walk me through this middleware", SKILLS)).toBe(
      "explain"
    );
  });
});

describe("matchRequest — score details", () => {
  it("trigger matches score higher than keyword-only matches", () => {
    const results = matchRequest("commit my changes", SKILLS);
    const commit = results.find((r) => r.skill_name === "commit");
    expect(commit).toBeDefined();
    expect(commit!.trigger_score).toBeGreaterThan(0);
    expect(commit!.trigger_score).toBeGreaterThanOrEqual(commit!.keyword_score);
  });

  it("scores multiple skills when request is ambiguous", () => {
    // "improve code quality" could match refactor or review-pr
    const results = matchRequest("improve code quality", SKILLS);
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("ranks exact trigger phrase match highest", () => {
    const results = matchRequest("fix this bug", SKILLS);
    expect(results[0].skill_name).toBe("debug");
    // The trigger match should dominate
    expect(results[0].trigger_score).toBeGreaterThan(0.5);
  });
});
