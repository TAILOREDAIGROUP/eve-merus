import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { calculateHealthScore } from "@/lib/health";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: libraryId } = await params;
    const db = getSupabaseClient();

    // Fetch library skills for token count
    const { data: skills } = await db
      .from("skills")
      .select("token_count")
      .eq("library_id", libraryId);

    const totalSkills = skills?.length || 0;
    const totalTokens = skills?.reduce(
      (sum, s) => sum + ((s.token_count as number) || 0),
      0
    ) || 0;

    // Fetch most recent scoring run
    const { data: scoringRun } = await db
      .from("scoring_runs")
      .select()
      .eq("library_id", libraryId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Fetch most recent collision analysis
    const { data: collisionAnalysis } = await db
      .from("collision_analyses")
      .select("overall_collision_score")
      .eq("library_id", libraryId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Calculate dead skills (skills never triggered as #1 in scoring)
    let deadSkillCount = 0;
    if (scoringRun) {
      const { data: results } = await db
        .from("scoring_results")
        .select("triggered_skill")
        .eq("run_id", scoringRun.id);

      const triggeredSkills = new Set(
        (results || [])
          .map((r) => r.triggered_skill as string)
          .filter(Boolean)
      );

      const { data: allSkills } = await db
        .from("skills")
        .select("name")
        .eq("library_id", libraryId);

      deadSkillCount = (allSkills || []).filter(
        (s) => !triggeredSkills.has(s.name as string)
      ).length;
    }

    const healthScore = calculateHealthScore({
      scoring_run: scoringRun
        ? {
            accuracy: scoringRun.accuracy as number,
            collision_rate: scoringRun.collision_rate as number,
            total_cases: scoringRun.total_cases as number,
            correct_count: scoringRun.correct_count as number,
          }
        : null,
      collision_analysis: collisionAnalysis
        ? {
            overall_collision_score:
              collisionAnalysis.overall_collision_score as number,
          }
        : null,
      total_skills: totalSkills,
      total_description_tokens: totalTokens,
      dead_skill_count: deadSkillCount,
    });

    // Store health score for history tracking
    await db.from("health_scores").insert({
      library_id: libraryId,
      total: healthScore.total,
      routing_accuracy: healthScore.routing_accuracy,
      collision_score: healthScore.collision_score,
      token_efficiency: healthScore.token_efficiency,
      dead_skills_score: healthScore.dead_skills_score,
      has_scoring_data: healthScore.has_scoring_data,
    });

    // Fetch historical scores for trend
    const { data: history } = await db
      .from("health_scores")
      .select("total, created_at")
      .eq("library_id", libraryId)
      .order("created_at", { ascending: true })
      .limit(20);

    return NextResponse.json({
      ...healthScore,
      history: history || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
