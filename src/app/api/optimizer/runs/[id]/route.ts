import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getSupabaseClient();

    const { data: run, error: runErr } = await db
      .from("optimization_runs")
      .select()
      .eq("id", id)
      .single();

    if (runErr && runErr.code === "PGRST116") {
      return NextResponse.json(
        { error: "Optimization run not found" },
        { status: 404 }
      );
    }
    if (runErr) {
      return NextResponse.json({ error: runErr.message }, { status: 500 });
    }

    const { data: experiments, error: expErr } = await db
      .from("experiments")
      .select()
      .eq("run_id", id)
      .order("created_at");

    if (expErr) {
      return NextResponse.json({ error: expErr.message }, { status: 500 });
    }

    return NextResponse.json({ run, experiments: experiments || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
