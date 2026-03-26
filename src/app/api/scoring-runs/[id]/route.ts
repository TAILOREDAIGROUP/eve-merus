import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getSupabaseClient();

    // Fetch the scoring run
    const { data: run, error: runErr } = await db
      .from("scoring_runs")
      .select()
      .eq("id", id)
      .single();

    if (runErr && runErr.code === "PGRST116") {
      return NextResponse.json(
        { error: "Scoring run not found" },
        { status: 404 }
      );
    }
    if (runErr) {
      return NextResponse.json({ error: runErr.message }, { status: 500 });
    }

    // Fetch per-case results with test case details
    const { data: results, error: resultsErr } = await db
      .from("scoring_results")
      .select(`
        id,
        test_case_id,
        triggered_skill,
        all_triggered,
        confidence,
        result_type,
        test_cases (
          request_text,
          expected_skill,
          difficulty,
          cluster_tag
        )
      `)
      .eq("run_id", id);

    if (resultsErr) {
      return NextResponse.json(
        { error: resultsErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      run,
      results: results || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
