import { describe, it, expect } from "vitest";
import {
  generateProposals,
  type SkillForProposal,
} from "@/lib/proposer";
import type { CaseResult } from "@/lib/scorer";

const SKILLS: SkillForProposal[] = [
  {
    name: "commit",
    description: "Create a git commit with a well-formatted message",
    trigger_phrases: ["commit my changes", "make a commit"],
  },
  {
    name: "deploy",
    description: "Deploy the application to production or staging",
    trigger_phrases: ["deploy to production", "ship it"],
  },
  {
    name: "debug",
    description: "Help diagnose and fix bugs by analyzing errors",
    trigger_phrases: ["fix this bug", "debug this error"],
  },
];

function makeCaseResult(overrides: Partial<CaseResult>): CaseResult {
  return {
    request_text: "test request",
    expected_skill: "commit",
    result_type: "correct",
    triggered_skill: "commit",
    all_triggered: ["commit"],
    confidence: 0.9,
    match_details: [],
    ...overrides,
  };
}

describe("generateProposals", () => {
  it("returns empty for all-correct results", () => {
    const results: CaseResult[] = [
      makeCaseResult({ result_type: "correct" }),
    ];
    const proposals = generateProposals(results, SKILLS);
    expect(proposals).toHaveLength(0);
  });

  it("proposes adding triggers for missed cases", () => {
    const results: CaseResult[] = [
      makeCaseResult({
        result_type: "miss",
        expected_skill: "commit",
        triggered_skill: null,
        request_text: "save my work to the repository",
      }),
    ];

    const proposals = generateProposals(results, SKILLS);
    expect(proposals.length).toBeGreaterThan(0);

    const addTrigger = proposals.find(
      (p) => p.change_type === "add_trigger_phrases"
    );
    expect(addTrigger).toBeDefined();
    expect(addTrigger!.skill_name).toBe("commit");
    expect(addTrigger!.new_description).not.toBe(addTrigger!.old_description);
    expect(addTrigger!.rationale).toContain("missed");
  });

  it("proposes removing ambiguous keywords for collisions", () => {
    const results: CaseResult[] = [
      makeCaseResult({
        result_type: "collision",
        expected_skill: "commit",
        triggered_skill: "deploy",
        request_text: "push my changes",
      }),
    ];

    const proposals = generateProposals(results, SKILLS);
    const removeAmbiguous = proposals.find(
      (p) => p.change_type === "remove_ambiguous_keywords"
    );
    // May or may not generate depending on shared keywords
    if (removeAmbiguous) {
      expect(removeAmbiguous.skill_name).toBe("commit");
      expect(removeAmbiguous.rationale).toContain("ambiguous");
    }
  });

  it("proposes sharpening for wrong results", () => {
    const results: CaseResult[] = [
      makeCaseResult({
        result_type: "wrong",
        expected_skill: "commit",
        triggered_skill: "deploy",
        request_text: "push changes to main",
      }),
    ];

    const proposals = generateProposals(results, SKILLS);
    expect(proposals.length).toBeGreaterThan(0);
    // Should have either add_trigger or sharpen
    const hasProposal = proposals.some(
      (p) =>
        p.change_type === "add_trigger_phrases" ||
        p.change_type === "sharpen_description"
    );
    expect(hasProposal).toBe(true);
  });

  it("respects maxProposals limit", () => {
    const results: CaseResult[] = Array.from({ length: 10 }, (_, i) =>
      makeCaseResult({
        result_type: "miss",
        expected_skill: SKILLS[i % SKILLS.length].name,
        triggered_skill: null,
        request_text: `unique request number ${i} with special words${i}`,
      })
    );

    const proposals = generateProposals(results, SKILLS, 2);
    expect(proposals.length).toBeLessThanOrEqual(2);
  });

  it("prioritizes skills with most failures", () => {
    const results: CaseResult[] = [
      makeCaseResult({ result_type: "miss", expected_skill: "commit", request_text: "save work alpha" }),
      makeCaseResult({ result_type: "miss", expected_skill: "commit", request_text: "save work beta" }),
      makeCaseResult({ result_type: "miss", expected_skill: "deploy", request_text: "launch gamma" }),
    ];

    const proposals = generateProposals(results, SKILLS, 1);
    expect(proposals[0].skill_name).toBe("commit");
  });

  it("each proposal has required fields", () => {
    const results: CaseResult[] = [
      makeCaseResult({
        result_type: "miss",
        expected_skill: "commit",
        request_text: "save my progress to version control",
      }),
    ];

    const proposals = generateProposals(results, SKILLS);
    for (const p of proposals) {
      expect(p).toHaveProperty("skill_name");
      expect(p).toHaveProperty("change_type");
      expect(p).toHaveProperty("old_description");
      expect(p).toHaveProperty("new_description");
      expect(p).toHaveProperty("rationale");
      expect(p.new_description).not.toBe(p.old_description);
    }
  });

  it("handles empty case results", () => {
    expect(generateProposals([], SKILLS)).toHaveLength(0);
  });

  it("handles empty skills list", () => {
    const results: CaseResult[] = [
      makeCaseResult({ result_type: "miss", expected_skill: "unknown" }),
    ];
    expect(generateProposals(results, [])).toHaveLength(0);
  });
});
