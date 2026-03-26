/**
 * Routing Scorer — runs a test set against a skills library
 * and classifies each result as correct/collision/wrong/miss.
 */

import { matchRequest, type SkillDefinition, type MatchResult } from "./matcher";

export type ResultType = "correct" | "collision" | "wrong" | "miss";

export interface CaseResult {
  request_text: string;
  expected_skill: string;
  result_type: ResultType;
  triggered_skill: string | null;
  all_triggered: string[];
  confidence: number | null;
  match_details: MatchResult[];
}

export interface ScoringRunResult {
  accuracy: number;
  collision_rate: number;
  total_cases: number;
  correct_count: number;
  collision_count: number;
  wrong_count: number;
  miss_count: number;
  case_results: CaseResult[];
}

export interface TestCaseForScoring {
  request_text: string;
  expected_skill: string;
  should_not_trigger?: string[];
}

/**
 * Classify a single match result against expectations.
 *
 * - CORRECT: expected skill is ranked #1
 * - COLLISION: expected skill matched but not #1 (beaten or tied by another)
 * - WRONG: skills matched but expected skill not in results
 * - MISS: no skills matched at all
 */
export function classifyResult(
  matches: MatchResult[],
  expectedSkill: string
): ResultType {
  if (matches.length === 0) return "miss";

  const topSkill = matches[0].skill_name;

  if (topSkill === expectedSkill) return "correct";

  // Check if expected skill is anywhere in results
  const expectedInResults = matches.some(
    (m) => m.skill_name === expectedSkill
  );

  if (expectedInResults) return "collision";

  return "wrong";
}

/**
 * Score a full test set against a skills library.
 * Returns aggregate metrics and per-case results.
 */
export function scoreTestSet(
  testCases: TestCaseForScoring[],
  skills: SkillDefinition[]
): ScoringRunResult {
  const caseResults: CaseResult[] = [];
  let correct = 0;
  let collision = 0;
  let wrong = 0;
  let miss = 0;

  for (const tc of testCases) {
    const matches = matchRequest(tc.request_text, skills);
    const resultType = classifyResult(matches, tc.expected_skill);

    switch (resultType) {
      case "correct":
        correct++;
        break;
      case "collision":
        collision++;
        break;
      case "wrong":
        wrong++;
        break;
      case "miss":
        miss++;
        break;
    }

    caseResults.push({
      request_text: tc.request_text,
      expected_skill: tc.expected_skill,
      result_type: resultType,
      triggered_skill: matches.length > 0 ? matches[0].skill_name : null,
      all_triggered: matches.map((m) => m.skill_name),
      confidence: matches.length > 0 ? matches[0].score : null,
      match_details: matches,
    });
  }

  const total = testCases.length;

  return {
    accuracy: total > 0 ? correct / total : 0,
    collision_rate: total > 0 ? collision / total : 0,
    total_cases: total,
    correct_count: correct,
    collision_count: collision,
    wrong_count: wrong,
    miss_count: miss,
    case_results: caseResults,
  };
}
