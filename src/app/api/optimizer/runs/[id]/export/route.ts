import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { exportExperimentsToTsv } from '@/lib/export';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const db = await getSupabaseClient();

    const { data: run, error: runErr } = await db
      .from('optimization_runs')
      .select()
      .eq('id', id)
      .single();

    if (runErr && runErr.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Optimization run not found' },
        { status: 404 }
      );
    }
    if (runErr) {
      return NextResponse.json({ error: runErr.message }, { status: 500 });
    }

    const { data: experiments, error: expErr } = await db
      .from('experiments')
      .select()
      .eq('run_id', id)
      .order('created_at');

    if (expErr) {
      return NextResponse.json({ error: expErr.message }, { status: 500 });
    }

    const tsv = exportExperimentsToTsv(
      (experiments || []).map((e) => ({
        id: e.id as string,
        change_type: e.change_type as string,
        old_description: e.old_description as string,
        new_description: e.new_description as string,
        accuracy_before: e.accuracy_before as number,
        accuracy_after: e.accuracy_after as number,
        collision_rate_before: e.collision_rate_before as number | null,
        collision_rate_after: e.collision_rate_after as number | null,
        kept: e.kept as boolean,
        created_at: e.created_at as string,
      }))
    );

    return new NextResponse(tsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/tab-separated-values',
        'Content-Disposition': `attachment; filename="results-${id}.tsv"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
