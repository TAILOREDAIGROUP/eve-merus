/**
 * Library Health Score Calculator
 *
 * Composite score 0-100 from four weighted components:
 *   - Routing Accuracy (40%): from most recent scoring run
 *   - Collision Rate (25%): inverted, fewer collisions = higher
 *   - Token Efficiency (20%): description tokens vs benchmark
 *   - Dead Skills (15%): skills that never matched any test case
 */

export interface HealthInput {
  // From scoring run (optional — may not exist yet)
  scoring_run?: {
    accuracy: number;        // 0-1
    collision_rate: number;  // 0-1
    total_cases: number;
    correct_count: number;
  } | null;

  // From collision analysis (optional)
  collision_analysis?: {
    overall_collision_score: number; // 0-100
  } | null;

  // Library stats
  total_skills: number;
  total_description_tokens: number;

  // Dead skills: skills that were never the top match in any scoring result
  dead_skill_count: number;
}

export interface HealthScore {
  total: number;              // 0-100
  routing_accuracy: number;   // 0-100 component score
  collision_score: number;    // 0-100 component score (inverted)
  token_efficiency: number;   // 0-100 component score
  dead_skills_score: number;  // 0-100 component score
  has_scoring_data: boolean;
  breakdown: {
    routing_accuracy_raw: number;
    collision_rate_raw: number;
    avg_tokens_per_skill: number;
    dead_skill_pct: number;
  };
}

// Token benchmark: 200 tokens per skill is considered optimal
const TOKEN_BENCHMARK = 200;

const W_ROUTING = 0.40;
const W_COLLISION = 0.25;
const W_TOKEN = 0.20;
const W_DEAD = 0.15;

/**
 * Calculate routing accuracy component (0-100).
 */
function calcRoutingScore(input: HealthInput): number {
  if (!input.scoring_run) return 0;
  return Math.round(input.scoring_run.accuracy * 100);
}

/**
 * Calculate collision component (0-100, inverted).
 * 0 collisions = 100, 100% collision = 0.
 */
function calcCollisionScore(input: HealthInput): number {
  if (input.collision_analysis) {
    return Math.max(0, 100 - input.collision_analysis.overall_collision_score);
  }
  if (input.scoring_run) {
    return Math.round((1 - input.scoring_run.collision_rate) * 100);
  }
  return 0;
}

/**
 * Calculate token efficiency component (0-100).
 * Optimal is TOKEN_BENCHMARK per skill. Penalize both under and over.
 * Under: skills may lack sufficient routing info
 * Over: descriptions may be bloated and cause confusion
 */
function calcTokenScore(input: HealthInput): number {
  if (input.total_skills === 0) return 0;

  const avg = input.total_description_tokens / input.total_skills;
  const ratio = avg / TOKEN_BENCHMARK;

  // Perfect: ratio = 1.0 → score 100
  // Under 0.3 or over 3.0 → score approaches 0
  if (ratio <= 0) return 0;
  if (ratio >= 0.5 && ratio <= 2.0) {
    // Sweet spot: 50-400 tokens per skill
    const distance = Math.abs(1.0 - ratio);
    return Math.round(Math.max(0, 100 - distance * 50));
  }
  if (ratio < 0.5) {
    return Math.round(ratio * 100);
  }
  // ratio > 2.0
  return Math.round(Math.max(0, 100 - (ratio - 1) * 40));
}

/**
 * Calculate dead skills component (0-100).
 * 0 dead skills = 100, all dead = 0.
 */
function calcDeadSkillsScore(input: HealthInput): number {
  if (input.total_skills === 0) return 0;
  const deadPct = input.dead_skill_count / input.total_skills;
  return Math.round((1 - deadPct) * 100);
}

/**
 * Calculate the composite Library Health Score.
 */
export function calculateHealthScore(input: HealthInput): HealthScore {
  const hasScoringData = !!input.scoring_run;

  const routing = calcRoutingScore(input);
  const collision = calcCollisionScore(input);
  const token = calcTokenScore(input);
  const dead = calcDeadSkillsScore(input);

  let total: number;
  if (hasScoringData) {
    total = Math.round(
      W_ROUTING * routing +
      W_COLLISION * collision +
      W_TOKEN * token +
      W_DEAD * dead
    );
  } else {
    // Without scoring data, only token efficiency contributes
    total = Math.round(W_TOKEN * token * (1 / W_TOKEN) * 0.3);
  }

  total = Math.max(0, Math.min(100, total));

  return {
    total,
    routing_accuracy: routing,
    collision_score: collision,
    token_efficiency: token,
    dead_skills_score: dead,
    has_scoring_data: hasScoringData,
    breakdown: {
      routing_accuracy_raw: input.scoring_run?.accuracy || 0,
      collision_rate_raw: input.scoring_run?.collision_rate || 0,
      avg_tokens_per_skill:
        input.total_skills > 0
          ? Math.round(input.total_description_tokens / input.total_skills)
          : 0,
      dead_skill_pct:
        input.total_skills > 0
          ? Math.round((input.dead_skill_count / input.total_skills) * 100)
          : 0,
    },
  };
}
