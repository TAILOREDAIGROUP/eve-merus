// Core domain types for EVE Merus

export interface Library {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  library_id: string;
  name: string;
  description: string;
  trigger_phrases: string[];
  content: string;
  token_count: number;
  line_count: number;
  source_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestSet {
  id: string;
  library_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  id: string;
  test_set_id: string;
  request_text: string;
  expected_skill: string;
  expected_supporting: string[];
  should_not_trigger: string[];
  difficulty: Difficulty;
  cluster_tag: string | null;
  created_at: string;
}

export type ResultType = "correct" | "collision" | "wrong" | "miss";

export interface ScoringRun {
  id: string;
  library_id: string;
  test_set_id: string;
  accuracy: number;
  collision_rate: number;
  total_cases: number;
  correct_count: number;
  collision_count: number;
  wrong_count: number;
  miss_count: number;
  created_at: string;
}

export interface ScoringResult {
  id: string;
  run_id: string;
  test_case_id: string;
  triggered_skill: string | null;
  all_triggered: string[];
  confidence: number | null;
  result_type: ResultType;
}

export type OptimizationStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface OptimizationRun {
  id: string;
  library_id: string;
  test_set_id: string;
  status: OptimizationStatus;
  iterations_completed: number;
  accuracy_start: number | null;
  accuracy_end: number | null;
  collision_rate_start: number | null;
  collision_rate_end: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface Experiment {
  id: string;
  run_id: string;
  skill_id: string;
  change_type: string;
  old_description: string;
  new_description: string;
  accuracy_before: number;
  accuracy_after: number;
  collision_rate_before: number | null;
  collision_rate_after: number | null;
  kept: boolean;
  created_at: string;
}

// Parsed skill data from SKILL.md files (before DB storage)
export interface ParsedSkill {
  name: string;
  description: string;
  trigger_phrases: string[];
  content: string;
  token_count: number;
  line_count: number;
  source_filename: string;
}

// Test case import/export format (JSON)
export interface TestCaseInput {
  request_text: string;
  expected_skill: string;
  expected_supporting?: string[];
  should_not_trigger?: string[];
  difficulty?: Difficulty;
  cluster_tag?: string;
}
