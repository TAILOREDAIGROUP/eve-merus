import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { scoreTestSet } from '@/lib/scorer';
import { requireAuth } from '@/lib/auth/requireAuth';
import type { SkillDefinition } from '@/lib/matcher';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { library_id, test_set_id } = body;

    if (!library_id || !test_set_id) {
      return NextResponse.json(
        { error: 'library_id and test_set_id are required' },
        { status: 400 }
      );
    }

    const db = await getSupabaseClient();

    const { data: skills, error: skillsErr } = await db
      .from('skills')
      .select('name, description, trigger_phrases')
      .eq('library_id', library_id);

    if (skillsErr) {
      return NextResponse.json(
        { error: `Failed to fetch skills: ${skillsErr.message}` },
        { status: 500 }
      );
    }

    if (!skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'Library has no skills' },
        { status: 400 }
      );
    }

    const { data: testCases, error: casesErr } = await db
      .from('test_cases')
      .select('id, request_text, expected_skill, should_not_trigger')
      .eq('test_set_id', test_set_id);

    if (casesErr) {
      return NextResponse.json(
        { error: `Failed to fetch test cases: ${casesErr.message}` },
        { status: 500 }
      );
    }

    if (!testCases || testCases.length === 0) {
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

    const scoringResult = scoreTestSet(
      testCases.map((tc) => ({
        request_text: tc.request_text as string,
        expected_skill: tc.expected_skill as string,
        should_not_trigger: (tc.should_not_trigger as string[]) || [],
      })),
      skillDefs
    );

    const { data: run, error: runErr } = await db
      .from('scoring_runs')
      .insert({
        library_id,
        test_set_id,
        accuracy: scoringResult.accuracy,
        collision_rate: scoringResult.collision_rate,
        total_cases: scoringResult.total_cases,
        correct_count: scoringResult.correct_count,
        collision_count: scoringResult.collision_count,
        wrong_count: scoringResult.wrong_count,
        miss_count: scoringResult.miss_count,
      })
      .select()
      .single();

    if (runErr) {
      return NextResponse.json(
        { error: `Failed to store scoring run: ${runErr.message}` },
        { status: 500 }
      );
    }

    const caseResultRows = scoringResult.case_results.map((cr, i) => ({
      run_id: run.id,
      test_case_id: testCases[i].id,
      triggered_skill: cr.triggered_skill,
      all_triggered: cr.all_triggered,
      confidence: cr.confidence,
      result_type: cr.result_type,
    }));

    const { error: resultsErr } = await db
      .from('scoring_results')
      .insert(caseResultRows);

    if (resultsErr) {
      return NextResponse.json(
        { error: `Failed to store results: ${resultsErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        run,
        summary: {
          accuracy: scoringResult.accuracy,
          collision_rate: scoringResult.collision_rate,
          total_cases: scoringResult.total_cases,
          correct_count: scoringResult.correct_count,
          collision_count: scoringResult.collision_count,
          wrong_count: scoringResult.wrong_count,
          miss_count: scoringResult.miss_count,
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

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const db = await getSupabaseClient();
    const { data, error } = await db
      .from('scoring_runs')
      .select()
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
