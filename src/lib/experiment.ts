/**
 * Experiment Runner — applies a proposed change, re-runs scoring,
 * and decides whether to keep or revert.
 */

import { scoreTestSet, type TestCaseForScoring } from "./scorer";
import type { SkillDefinition } from "./matcher";
import type { Proposal } from "./proposer";

export interface ExperimentResult {
  skill_name: string;
  change_type: string;
  old_description: string;
  new_description: string;
  accuracy_before: number;
  accuracy_after: number;
  collision_rate_before: number;
  collision_rate_after: number;
  kept: boolean;
  rationale: string;
}

/**
 * Run a single experiment: apply a proposal, re-score, decide.
 *
 * Returns the result and the updated skills array (if kept).
 */
export function runExperiment(
  proposal: Proposal,
  skills: SkillDefinition[],
  testCases: TestCaseForScoring[],
  baselineAccuracy: number,
  baselineCollisionRate: number
): { result: ExperimentResult; updatedSkills: SkillDefinition[] } {
  // Apply the change to create modified skills
  const modifiedSkills = skills.map((s) => {
    if (s.name === proposal.skill_name) {
      return {
        ...s,
        description: proposal.new_description,
      };
    }
    return s;
  });

  // Re-score with modified descriptions
  const newScoring = scoreTestSet(testCases, modifiedSkills);

  // Decision: keep if accuracy improved OR (accuracy same AND collision improved)
  const accuracyImproved = newScoring.accuracy > baselineAccuracy;
  const accuracySame = Math.abs(newScoring.accuracy - baselineAccuracy) < 0.001;
  const collisionImproved = newScoring.collision_rate < baselineCollisionRate;

  const kept = accuracyImproved || (accuracySame && collisionImproved);

  const result: ExperimentResult = {
    skill_name: proposal.skill_name,
    change_type: proposal.change_type,
    old_description: proposal.old_description,
    new_description: proposal.new_description,
    accuracy_before: baselineAccuracy,
    accuracy_after: newScoring.accuracy,
    collision_rate_before: baselineCollisionRate,
    collision_rate_after: newScoring.collision_rate,
    kept,
    rationale: kept
      ? `Improved: accuracy ${Math.round(baselineAccuracy * 100)}% → ${Math.round(newScoring.accuracy * 100)}%, collisions ${Math.round(baselineCollisionRate * 100)}% → ${Math.round(newScoring.collision_rate * 100)}%`
      : `Reverted: accuracy ${Math.round(baselineAccuracy * 100)}% → ${Math.round(newScoring.accuracy * 100)}% (no improvement)`,
  };

  return {
    result,
    updatedSkills: kept ? modifiedSkills : skills,
  };
}
