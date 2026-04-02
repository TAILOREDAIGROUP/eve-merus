import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { runOptimizationLoop } from '@/lib/optimizer';
import { requireAuth } from '@/lib/auth/requireAuth';
import type { SkillDefinition } from '@/lib/matcher';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { library_id, test_set_id, max_iterations, proposals_per_iteration } =
      body;

    if (!library_id || !test_set_id) {
      return NextResponse.json(
        { error: 'library_id and test_set_id are required' },
        { status: 400 }
      );
    }

    const db = await getSupabaseClient();

    const { data: skills, error: skillsErr } = await db
      .from('skills')
      .select('id, name, description, trigger_phrases')
      .eq('library_id', library_id);

    if (skillsErr || !skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'Library has no skills' },
        { status: 400 }
      );
    }

    const { data: testCases, error: casesErr } = await db
      .from('test_cases')
      .select('request_text, expected_skill, should_not_trigger')
      .eq('test_set_id', test_set_id);

    if (casesErr || !testCases || testCases.length === 0) {
      return NextResponse.json(
        { error: 'Test set has no cases' },
        { status: 400 }
      );
    }

    const skillDefs: SkillDefinition[] = skills.map((s) => ({
      name: s.name as string,
      description: s.description as string,
      trigger_phrases: (s.trigger_phrases as string[]) || [],
    }));

    const skillIdMap = new Map(
      skills.map((s) => [s.name as string, s.id as string])
    );

    const result = runOptimizationLoop(
      skillDefs,
      testCases.map((tc) => ({
        request_text: tc.request_text as string,
        expected_skill: tc.expected_skill as string,
      })),
      { max_iterations, proposals_per_iteration }
    );

    const { data: run, error: runErr } = await db
      .from('optimization_runs')
      .insert({
        library_id,
        test_set_id,
        status: 'completed',
        iterations_completed: result.iterations_completed,
        accuracy_start: result.accuracy_start,
        accuracy_end: result.accuracy_end,
        collision_rate_start: result.collision_rate_start,
        collision_rate_end: result.collision_rate_end,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runErr) {
      return NextResponse.json({ error: runErr.message }, { status: 500 });
    }

    if (result.experiments.length > 0) {
      const experimentRows = result.experiments.map((e) => ({
        run_id: run.id,
        skill_id: skillIdMap.get(e.skill_name) || skills[0].id,
        change_type: e.change_type,
        old_description: e.old_description,
        new_description: e.new_description,
        accuracy_before: e.accuracy_before,
        accuracy_after: e.accuracy_after,
        collision_rate_before: e.collision_rate_before,
        collision_rate_after: e.collision_rate_after,
        kept: e.kept,
      }));

      await db.from('experiments').insert(experimentRows);
    }

    return NextResponse.json(
      {
        run,
        summary: {
          iterations: result.iterations_completed,
          accuracy_start: result.accuracy_start,
          accuracy_end: result.accuracy_end,
          collision_rate_start: result.collision_rate_start,
          collision_rate_end: result.collision_rate_end,
          kept: result.improvements_kept,
          reverted: result.improvements_reverted,
          total_experiments: result.experiments.length,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
