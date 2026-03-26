-- EVE Merus Database Schema
-- AI Skills Library Optimization Engine

-- Libraries: a collection of skills
CREATE TABLE libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skills: individual skill definitions within a library
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_phrases TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  line_count INTEGER NOT NULL DEFAULT 0,
  source_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(library_id, name)
);

-- Test Sets: named collections of test cases for a library
CREATE TABLE test_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Test Cases: individual routing test requests
CREATE TABLE test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_set_id UUID NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,
  expected_skill TEXT NOT NULL,
  expected_supporting TEXT[] DEFAULT '{}',
  should_not_trigger TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cluster_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scoring Runs: results of scoring a test set against a library
CREATE TABLE scoring_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  test_set_id UUID NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
  accuracy REAL NOT NULL,
  collision_rate REAL NOT NULL,
  total_cases INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  collision_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  miss_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scoring Results: per-test-case outcomes within a scoring run
CREATE TABLE scoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES scoring_runs(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  triggered_skill TEXT,
  all_triggered TEXT[] DEFAULT '{}',
  confidence REAL,
  result_type TEXT NOT NULL CHECK (result_type IN ('correct', 'collision', 'wrong', 'miss'))
);

-- Optimization Runs: an optimization session
CREATE TABLE optimization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  test_set_id UUID NOT NULL REFERENCES test_sets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  iterations_completed INTEGER NOT NULL DEFAULT 0,
  accuracy_start REAL,
  accuracy_end REAL,
  collision_rate_start REAL,
  collision_rate_end REAL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Experiments: individual optimization attempts within a run
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  old_description TEXT NOT NULL,
  new_description TEXT NOT NULL,
  accuracy_before REAL NOT NULL,
  accuracy_after REAL NOT NULL,
  collision_rate_before REAL,
  collision_rate_after REAL,
  kept BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_skills_library ON skills(library_id);
CREATE INDEX idx_test_cases_set ON test_cases(test_set_id);
CREATE INDEX idx_scoring_results_run ON scoring_results(run_id);
CREATE INDEX idx_experiments_run ON experiments(run_id);
CREATE INDEX idx_scoring_runs_library ON scoring_runs(library_id);
