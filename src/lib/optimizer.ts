/**
 * Optimization Loop — iteratively improves a skills library.
 *
 * 1. Score the current library
 * 2. Generate proposals from failures
 * 3. Run experiments (apply, re-score, keep/revert)
 * 4. Repeat until no more improvements or max iterations
 */

import { scoreTestSet, type TestCaseForScoring, type ScoringRunResult } from "./scorer";
import { generateProposals, type SkillForProposal } from "./proposer";
import { runExperiment, type ExperimentResult } from "./experiment";
import type { SkillDefinition } from "./matcher";

export interface OptimizationConfig {
  max_iterations: number;
  proposals_per_iteration: number;
}

export interface OptimizationResult {
  iterations_completed: number;
  accuracy_start: number;
  accuracy_end: number;
  collision_rate_start: number;
  collision_rate_end: number;
  experiments: ExperimentResult[];
  final_skills: SkillDefinition[];
  improvements_kept: number;
  improvements_reverted: number;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  max_iterations: 10,
  proposals_per_iteration: 3,
};

/**
 * Run the full optimization loop.
 */
export function runOptimizationLoop(
  skills: SkillDefinition[],
  testCases: TestCaseForScoring[],
  config: Partial<OptimizationConfig> = {}
): OptimizationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let currentSkills = [...skills.map((s) => ({ ...s }))];
  const allExperiments: ExperimentResult[] = [];

  // Initial scoring
  const initialScoring = scoreTestSet(testCases, currentSkills);
  let currentAccuracy = initialScoring.accuracy;
  let currentCollisionRate = initialScoring.collision_rate;

  const accuracyStart = currentAccuracy;
  const collisionRateStart = currentCollisionRate;

  let iterationsCompleted = 0;

  for (let iter = 0; iter < cfg.max_iterations; iter++) {
    // Score current state
    const scoring = scoreTestSet(testCases, currentSkills);
    currentAccuracy = scoring.accuracy;
    currentCollisionRate = scoring.collision_rate;

    // Perfect score — nothing to improve
    if (currentAccuracy >= 1.0 && currentCollisionRate <= 0) {
      iterationsCompleted = iter;
      break;
    }

    // Generate proposals from failures
    const skillsForProposal: SkillForProposal[] = currentSkills.map((s) => ({
      name: s.name,
      description: s.description,
      trigger_phrases: s.trigger_phrases,
    }));

    const proposals = generateProposals(
      scoring.case_results,
      skillsForProposal,
      cfg.proposals_per_iteration
    );

    if (proposals.length === 0) {
      iterationsCompleted = iter;
      break;
    }

    // Run experiments
    let anyKept = false;
    for (const proposal of proposals) {
      const { result, updatedSkills } = runExperiment(
        proposal,
        currentSkills,
        testCases,
        currentAccuracy,
        currentCollisionRate
      );

      allExperiments.push(result);

      if (result.kept) {
        currentSkills = updatedSkills;
        currentAccuracy = result.accuracy_after;
        currentCollisionRate = result.collision_rate_after;
        anyKept = true;
      }
    }

    iterationsCompleted = iter + 1;

    // No improvements this iteration — stop
    if (!anyKept) break;
  }

  return {
    iterations_completed: iterationsCompleted,
    accuracy_start: accuracyStart,
    accuracy_end: currentAccuracy,
    collision_rate_start: collisionRateStart,
    collision_rate_end: currentCollisionRate,
    experiments: allExperiments,
    final_skills: currentSkills,
    improvements_kept: allExperiments.filter((e) => e.kept).length,
    improvements_reverted: allExperiments.filter((e) => !e.kept).length,
  };
}
