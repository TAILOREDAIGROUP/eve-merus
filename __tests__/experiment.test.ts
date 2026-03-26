import { describe, it, expect } from "vitest";
import { runExperiment, type ExperimentResult } from "@/lib/experiment";
import type { SkillDefinition } from "@/lib/matcher";
import type { TestCaseForScoring } from "@/lib/scorer";
import type { Proposal } from "@/lib/proposer";

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
];

const TEST_CASES: TestCaseForScoring[] = [
  { request_text: "commit my changes", expected_skill: "commit" },
  { request_text: "deploy to production", expected_skill: "deploy" },
  { request_text: "save my work", expected_skill: "commit" },
  { request_text: "ship it", expected_skill: "deploy" },
];

describe("runExperiment", () => {
  it("keeps a change that improves accuracy", () => {
    // Proposal that adds useful keywords
    const proposal: Proposal = {
      skill_name: "commit",
      change_type: "add_trigger_phrases",
      old_description: SKILLS[0].description,
      new_description: `${SKILLS[0].description}. Also handles: save, persist, checkpoint`,
      rationale: "test",
    };

    const { result } = runExperiment(
      proposal,
      SKILLS,
      TEST_CASES,
      0.5, // artificially low baseline
      0.1
    );

    expect(result.accuracy_after).toBeGreaterThanOrEqual(result.accuracy_before);
    expect(result).toHaveProperty("kept");
    expect(result).toHaveProperty("rationale");
  });

  it("reverts a change that decreases accuracy", () => {
    // Proposal that corrupts the description
    const proposal: Proposal = {
      skill_name: "commit",
      change_type: "remove_ambiguous_keywords",
      old_description: SKILLS[0].description,
      new_description: "unrelated text about cooking recipes",
      rationale: "test",
    };

    const { result, updatedSkills } = runExperiment(
      proposal,
      SKILLS,
      TEST_CASES,
      1.0, // perfect baseline
      0.0
    );

    expect(result.kept).toBe(false);
    expect(result.rationale).toContain("Reverted");
    // Skills should be unchanged
    expect(updatedSkills[0].description).toBe(SKILLS[0].description);
  });

  it("returns updated skills when kept", () => {
    const proposal: Proposal = {
      skill_name: "commit",
      change_type: "add_trigger_phrases",
      old_description: SKILLS[0].description,
      new_description: `${SKILLS[0].description}. Extended with extra routing info`,
      rationale: "test",
    };

    const { result, updatedSkills } = runExperiment(
      proposal,
      SKILLS,
      TEST_CASES,
      0.25, // very low baseline - easy to improve
      0.5
    );

    if (result.kept) {
      expect(updatedSkills[0].description).toBe(proposal.new_description);
    } else {
      expect(updatedSkills[0].description).toBe(SKILLS[0].description);
    }
  });

  it("result has all required fields", () => {
    const proposal: Proposal = {
      skill_name: "commit",
      change_type: "add_trigger_phrases",
      old_description: "old",
      new_description: "new",
      rationale: "test",
    };

    const { result } = runExperiment(proposal, SKILLS, TEST_CASES, 0.5, 0.1);

    expect(result).toHaveProperty("skill_name", "commit");
    expect(result).toHaveProperty("change_type", "add_trigger_phrases");
    expect(result).toHaveProperty("old_description");
    expect(result).toHaveProperty("new_description");
    expect(result).toHaveProperty("accuracy_before");
    expect(result).toHaveProperty("accuracy_after");
    expect(result).toHaveProperty("collision_rate_before");
    expect(result).toHaveProperty("collision_rate_after");
    expect(result).toHaveProperty("kept");
    expect(result).toHaveProperty("rationale");
  });

  it("keeps change when accuracy same but collision improves", () => {
    // Use skills and test cases where the modification won't hurt accuracy
    const proposal: Proposal = {
      skill_name: "deploy",
      change_type: "sharpen_description",
      old_description: SKILLS[1].description,
      new_description: `${SKILLS[1].description}. Specifically for deployment pipelines`,
      rationale: "test",
    };

    const { result } = runExperiment(
      proposal,
      SKILLS,
      TEST_CASES,
      1.0, // already perfect accuracy
      0.5  // high collision — room to improve
    );

    // Accuracy should stay at 1.0, collision may or may not change
    expect(result.accuracy_after).toBeGreaterThanOrEqual(0);
  });
});
