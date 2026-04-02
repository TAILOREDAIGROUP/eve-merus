import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { calculateHealthScore } from '@/lib/health';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: libraryId } = await params;
    const db = await getSupabaseClient();

    // Fetch library skills for token count
    const { data: skills } = await db
      .from('skills')
      .select('token_count')
      .eq('library_id', libraryId);

    const totalSkills = skills?.length || 0;
    const totalTokens =
      skills?.reduce(
        (sum, s) => sum + ((s.token_count as number) || 0),
        0
      ) || 0;

    // Fetch most recent scoring run
    const { data: scoringRun } = await db
      .from('scoring_runs')
      .select()
      .eq('library_id', libraryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch most recent collision analysis
    const { data: collisionAnalysis } = await db
      .from('collision_analyses')
      .select('overall_collision_score')
      .eq('library_id', libraryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate dead skills (skills never triggered as #1 in scoring)
    let deadSkillCount = 0;
    if (scoringRun) {
      const { data: results } = await db
        .from('scoring_results')
        .select('triggered_skill')
        .eq('run_id', scoringRun.id);

      const triggeredSkills = new Set(
        (results || [])
          .map((r) => r.triggered_skill as string)
          .filter(Boolean)
      );

      const { data: allSkills } = await db
        .from('skills')
        .select('name')
        .eq('library_id', libraryId);

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

    // Fetch historical scores for trend (read-only, no insert on GET)
    const { data: history } = await db
      .from('health_scores')
      .select('total, created_at')
      .eq('library_id', libraryId)
      .order('created_at', { ascending: true })
      .limit(20);

    return NextResponse.json({
      ...healthScore,
      history: history || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Store a health score snapshot.
 * Separated from GET to fix API-001 (GET should not have side effects).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: libraryId } = await params;
    const db = await getSupabaseClient();

    const { data: skills } = await db
      .from('skills')
      .select('token_count')
      .eq('library_id', libraryId);

    const totalSkills = skills?.length || 0;
    const totalTokens =
      skills?.reduce(
        (sum, s) => sum + ((s.token_count as number) || 0),
        0
      ) || 0;

    const { data: scoringRun } = await db
      .from('scoring_runs')
      .select()
      .eq('library_id', libraryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: collisionAnalysis } = await db
      .from('collision_analyses')
      .select('overall_collision_score')
      .eq('library_id', libraryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let deadSkillCount = 0;
    if (scoringRun) {
      const { data: results } = await db
        .from('scoring_results')
        .select('triggered_skill')
        .eq('run_id', scoringRun.id);

      const triggeredSkills = new Set(
        (results || [])
          .map((r) => r.triggered_skill as string)
          .filter(Boolean)
      );

      const { data: allSkills } = await db
        .from('skills')
        .select('name')
        .eq('library_id', libraryId);

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

    await db.from('health_scores').insert({
      library_id: libraryId,
      total: healthScore.total,
      routing_accuracy: healthScore.routing_accuracy,
      collision_score: healthScore.collision_score,
      token_efficiency: healthScore.token_efficiency,
      dead_skills_score: healthScore.dead_skills_score,
      has_scoring_data: healthScore.has_scoring_data,
    });

    return NextResponse.json(healthScore, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
