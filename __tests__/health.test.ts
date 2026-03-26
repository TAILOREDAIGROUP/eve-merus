import { describe, it, expect } from "vitest";
import { calculateHealthScore, type HealthInput } from "@/lib/health";

describe("calculateHealthScore", () => {
  it("returns 100 for a perfect library", () => {
    const input: HealthInput = {
      scoring_run: {
        accuracy: 1.0,
        collision_rate: 0,
        total_cases: 20,
        correct_count: 20,
      },
      collision_analysis: { overall_collision_score: 0 },
      total_skills: 10,
      total_description_tokens: 2000, // 200 per skill = perfect
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.total).toBe(100);
    expect(result.routing_accuracy).toBe(100);
    expect(result.collision_score).toBe(100);
    expect(result.dead_skills_score).toBe(100);
  });

  it("returns low score for a terrible library", () => {
    const input: HealthInput = {
      scoring_run: {
        accuracy: 0.1,
        collision_rate: 0.8,
        total_cases: 20,
        correct_count: 2,
      },
      collision_analysis: { overall_collision_score: 80 },
      total_skills: 10,
      total_description_tokens: 100, // 10 per skill = way too low
      dead_skill_count: 8,
    };

    const result = calculateHealthScore(input);
    expect(result.total).toBeLessThan(30);
    expect(result.routing_accuracy).toBe(10);
    expect(result.collision_score).toBe(20);
    expect(result.dead_skills_score).toBe(20);
  });

  it("handles missing scoring run", () => {
    const input: HealthInput = {
      scoring_run: null,
      total_skills: 10,
      total_description_tokens: 2000,
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.has_scoring_data).toBe(false);
    // Score should be low without scoring data
    expect(result.total).toBeLessThan(50);
    expect(result.routing_accuracy).toBe(0);
  });

  it("handles missing collision analysis, uses scoring run collision rate", () => {
    const input: HealthInput = {
      scoring_run: {
        accuracy: 0.9,
        collision_rate: 0.1,
        total_cases: 10,
        correct_count: 9,
      },
      collision_analysis: null,
      total_skills: 5,
      total_description_tokens: 1000,
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.collision_score).toBe(90); // 1 - 0.1 = 0.9 = 90%
  });

  it("gives 100 token efficiency at benchmark", () => {
    const input: HealthInput = {
      scoring_run: { accuracy: 1, collision_rate: 0, total_cases: 10, correct_count: 10 },
      total_skills: 10,
      total_description_tokens: 2000, // 200 per skill
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.token_efficiency).toBe(100);
  });

  it("penalizes very low token counts", () => {
    const input: HealthInput = {
      scoring_run: { accuracy: 1, collision_rate: 0, total_cases: 10, correct_count: 10 },
      total_skills: 10,
      total_description_tokens: 200, // 20 per skill = too low
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.token_efficiency).toBeLessThan(50);
  });

  it("penalizes very high token counts (bloated)", () => {
    const input: HealthInput = {
      scoring_run: { accuracy: 1, collision_rate: 0, total_cases: 10, correct_count: 10 },
      total_skills: 10,
      total_description_tokens: 10000, // 1000 per skill = bloated
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.token_efficiency).toBeLessThan(80);
  });

  it("dead skills reduce score", () => {
    const input: HealthInput = {
      scoring_run: { accuracy: 1, collision_rate: 0, total_cases: 10, correct_count: 10 },
      total_skills: 10,
      total_description_tokens: 2000,
      dead_skill_count: 5, // 50% dead
    };

    const result = calculateHealthScore(input);
    expect(result.dead_skills_score).toBe(50);
    expect(result.total).toBeLessThan(100);
  });

  it("score is clamped between 0 and 100", () => {
    const input: HealthInput = {
      scoring_run: { accuracy: 0, collision_rate: 1, total_cases: 10, correct_count: 0 },
      collision_analysis: { overall_collision_score: 100 },
      total_skills: 10,
      total_description_tokens: 0,
      dead_skill_count: 10,
    };

    const result = calculateHealthScore(input);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("handles zero skills", () => {
    const input: HealthInput = {
      scoring_run: null,
      total_skills: 0,
      total_description_tokens: 0,
      dead_skill_count: 0,
    };

    const result = calculateHealthScore(input);
    expect(result.total).toBe(0);
    expect(result.token_efficiency).toBe(0);
  });

  it("includes breakdown data", () => {
    const input: HealthInput = {
      scoring_run: { accuracy: 0.85, collision_rate: 0.15, total_cases: 20, correct_count: 17 },
      total_skills: 7,
      total_description_tokens: 1400,
      dead_skill_count: 1,
    };

    const result = calculateHealthScore(input);
    expect(result.breakdown.routing_accuracy_raw).toBe(0.85);
    expect(result.breakdown.collision_rate_raw).toBe(0.15);
    expect(result.breakdown.avg_tokens_per_skill).toBe(200);
    expect(result.breakdown.dead_skill_pct).toBe(14);
  });

  it("returns has_scoring_data correctly", () => {
    expect(
      calculateHealthScore({
        scoring_run: { accuracy: 1, collision_rate: 0, total_cases: 1, correct_count: 1 },
        total_skills: 1,
        total_description_tokens: 200,
        dead_skill_count: 0,
      }).has_scoring_data
    ).toBe(true);

    expect(
      calculateHealthScore({
        scoring_run: null,
        total_skills: 1,
        total_description_tokens: 200,
        dead_skill_count: 0,
      }).has_scoring_data
    ).toBe(false);
  });
});
