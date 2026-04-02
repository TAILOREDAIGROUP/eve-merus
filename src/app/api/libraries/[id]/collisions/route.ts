import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { analyzeCollisions } from '@/lib/collision';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: libraryId } = await params;
    const db = await getSupabaseClient();

    const { data: skills, error: skillsErr } = await db
      .from('skills')
      .select('name, description, trigger_phrases')
      .eq('library_id', libraryId);

    if (skillsErr) {
      return NextResponse.json(
        { error: skillsErr.message },
        { status: 500 }
      );
    }

    if (!skills || skills.length < 2) {
      return NextResponse.json(
        { error: 'Library needs at least 2 skills for collision analysis' },
        { status: 400 }
      );
    }

    const analysis = analyzeCollisions(
      skills.map((s) => ({
        name: s.name as string,
        description: s.description as string,
        trigger_phrases: (s.trigger_phrases as string[]) || [],
      })),
      libraryId
    );

    const { data: row, error: insertErr } = await db
      .from('collision_analyses')
      .insert({
        library_id: libraryId,
        total_pairs: analysis.total_pairs,
        critical_count: analysis.critical_count,
        high_count: analysis.high_count,
        medium_count: analysis.medium_count,
        low_count: analysis.low_count,
        clean_count: analysis.clean_count,
        overall_collision_score: analysis.overall_collision_score,
        pairs: analysis.collision_pairs,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: libraryId } = await params;
    const db = await getSupabaseClient();

    const { data, error } = await db
      .from('collision_analyses')
      .select()
      .eq('library_id', libraryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'No collision analysis found. Run one first.' },
        { status: 404 }
      );
    }
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
