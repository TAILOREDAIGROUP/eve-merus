-- EVE Merus: Add user ownership and Row Level Security
-- Adds user_id to libraries (root entity), enables RLS on all tables,
-- and creates policies so users can only access their own data.

-- ── Step 1: Add user_id to libraries ──────────────────────────────

ALTER TABLE libraries ADD COLUMN user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
CREATE INDEX idx_libraries_user ON libraries(user_id);

-- Remove the default after migration (existing rows get the placeholder)
ALTER TABLE libraries ALTER COLUMN user_id DROP DEFAULT;

-- ── Step 2: Enable RLS on all tables ──────────────────────────────

ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collision_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Libraries policies (root entity) ──────────────────────

CREATE POLICY libraries_select_own ON libraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY libraries_insert_own ON libraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY libraries_update_own ON libraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY libraries_delete_own ON libraries
  FOR DELETE USING (auth.uid() = user_id);

-- ── Step 4: Child table policies (scope through library) ──────────

-- Skills: owned via library
CREATE POLICY skills_select_own ON skills
  FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY skills_insert_own ON skills
  FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY skills_update_own ON skills
  FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY skills_delete_own ON skills
  FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Test Sets: owned via library
CREATE POLICY test_sets_select_own ON test_sets
  FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY test_sets_insert_own ON test_sets
  FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY test_sets_update_own ON test_sets
  FOR UPDATE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY test_sets_delete_own ON test_sets
  FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Test Cases: owned via test_set -> library
CREATE POLICY test_cases_select_own ON test_cases
  FOR SELECT USING (test_set_id IN (
    SELECT ts.id FROM test_sets ts
    JOIN libraries l ON ts.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY test_cases_insert_own ON test_cases
  FOR INSERT WITH CHECK (test_set_id IN (
    SELECT ts.id FROM test_sets ts
    JOIN libraries l ON ts.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY test_cases_update_own ON test_cases
  FOR UPDATE USING (test_set_id IN (
    SELECT ts.id FROM test_sets ts
    JOIN libraries l ON ts.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY test_cases_delete_own ON test_cases
  FOR DELETE USING (test_set_id IN (
    SELECT ts.id FROM test_sets ts
    JOIN libraries l ON ts.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

-- Scoring Runs: owned via library
CREATE POLICY scoring_runs_select_own ON scoring_runs
  FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY scoring_runs_insert_own ON scoring_runs
  FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY scoring_runs_delete_own ON scoring_runs
  FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Scoring Results: owned via scoring_run -> library
CREATE POLICY scoring_results_select_own ON scoring_results
  FOR SELECT USING (run_id IN (
    SELECT sr.id FROM scoring_runs sr
    JOIN libraries l ON sr.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY scoring_results_insert_own ON scoring_results
  FOR INSERT WITH CHECK (run_id IN (
    SELECT sr.id FROM scoring_runs sr
    JOIN libraries l ON sr.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY scoring_results_delete_own ON scoring_results
  FOR DELETE USING (run_id IN (
    SELECT sr.id FROM scoring_runs sr
    JOIN libraries l ON sr.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

-- Optimization Runs: owned via library
CREATE POLICY optimization_runs_select_own ON optimization_runs
  FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY optimization_runs_insert_own ON optimization_runs
  FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY optimization_runs_delete_own ON optimization_runs
  FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Experiments: owned via optimization_run -> library
CREATE POLICY experiments_select_own ON experiments
  FOR SELECT USING (run_id IN (
    SELECT o.id FROM optimization_runs o
    JOIN libraries l ON o.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY experiments_insert_own ON experiments
  FOR INSERT WITH CHECK (run_id IN (
    SELECT o.id FROM optimization_runs o
    JOIN libraries l ON o.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

CREATE POLICY experiments_delete_own ON experiments
  FOR DELETE USING (run_id IN (
    SELECT o.id FROM optimization_runs o
    JOIN libraries l ON o.library_id = l.id
    WHERE l.user_id = auth.uid()
  ));

-- Collision Analyses: owned via library
CREATE POLICY collision_analyses_select_own ON collision_analyses
  FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY collision_analyses_insert_own ON collision_analyses
  FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY collision_analyses_delete_own ON collision_analyses
  FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

-- Health Scores: owned via library
CREATE POLICY health_scores_select_own ON health_scores
  FOR SELECT USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY health_scores_insert_own ON health_scores
  FOR INSERT WITH CHECK (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));

CREATE POLICY health_scores_delete_own ON health_scores
  FOR DELETE USING (library_id IN (SELECT id FROM libraries WHERE user_id = auth.uid()));
