-- Health score history for tracking over time
CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  total INTEGER NOT NULL,
  routing_accuracy INTEGER NOT NULL DEFAULT 0,
  collision_score INTEGER NOT NULL DEFAULT 0,
  token_efficiency INTEGER NOT NULL DEFAULT 0,
  dead_skills_score INTEGER NOT NULL DEFAULT 0,
  has_scoring_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_scores_library ON health_scores(library_id);
