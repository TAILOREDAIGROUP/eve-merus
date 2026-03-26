-- Collision analysis results
CREATE TABLE collision_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  total_pairs INTEGER NOT NULL,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  low_count INTEGER NOT NULL DEFAULT 0,
  clean_count INTEGER NOT NULL DEFAULT 0,
  overall_collision_score INTEGER NOT NULL DEFAULT 0,
  pairs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collision_analyses_library ON collision_analyses(library_id);
