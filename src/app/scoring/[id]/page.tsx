"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ScoreBadge } from "@/components/score-badge";
import { AccuracyRing } from "@/components/accuracy-ring";

interface ScoringRun {
  id: string;
  library_id: string;
  test_set_id: string;
  accuracy: number;
  collision_rate: number;
  total_cases: number;
  correct_count: number;
  collision_count: number;
  wrong_count: number;
  miss_count: number;
  created_at: string;
}

interface CaseResult {
  id: string;
  test_case_id: string;
  triggered_skill: string | null;
  all_triggered: string[];
  confidence: number | null;
  result_type: "correct" | "collision" | "wrong" | "miss";
  test_cases: {
    request_text: string;
    expected_skill: string;
    difficulty: string;
    cluster_tag: string | null;
  } | null;
}

type FilterType = "all" | "correct" | "collision" | "wrong" | "miss";

export default function ScoringResultPage() {
  const params = useParams();
  const id = params.id as string;

  const [run, setRun] = useState<ScoringRun | null>(null);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/scoring-runs/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setRun(data.run);
      setResults(data.results);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="p-8 text-[var(--muted)]">Loading...</div>;
  }

  if (!run) {
    return <div className="p-8 text-[var(--danger)]">Scoring run not found</div>;
  }

  const filtered =
    filter === "all"
      ? results
      : results.filter((r) => r.result_type === filter);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">Scoring Results</h1>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <AccuracyRing value={run.accuracy} label="Routing Accuracy" />
        <AccuracyRing
          value={1 - run.collision_rate}
          label="Collision-Free Rate"
        />
        <div className="flex flex-col items-center justify-center p-4 border border-[var(--border)] rounded">
          <div className="text-3xl font-bold">{run.total_cases}</div>
          <div className="text-xs text-[var(--muted)]">Total Cases</div>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border border-[var(--border)] rounded space-y-1">
          <div className="flex gap-3 text-sm">
            <span className="text-green-400">{run.correct_count} correct</span>
            <span className="text-amber-400">
              {run.collision_count} collision
            </span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-red-400">{run.wrong_count} wrong</span>
            <span className="text-red-400">{run.miss_count} miss</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "correct", "collision", "wrong", "miss"] as FilterType[]).map(
          (f) => {
            const count =
              f === "all"
                ? results.length
                : results.filter((r) => r.result_type === f).length;
            return (
              <button
                key={f}
                className={`px-3 py-1.5 text-sm rounded border ${
                  filter === f
                    ? "bg-[var(--accent)] border-[var(--accent)]"
                    : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]"
                }`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Results table */}
      <div className="border border-[var(--border)] rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="p-3 text-left text-xs text-[var(--muted)] font-medium">
                Result
              </th>
              <th className="p-3 text-left text-xs text-[var(--muted)] font-medium">
                Request
              </th>
              <th className="p-3 text-left text-xs text-[var(--muted)] font-medium">
                Expected
              </th>
              <th className="p-3 text-left text-xs text-[var(--muted)] font-medium">
                Matched
              </th>
              <th className="p-3 text-left text-xs text-[var(--muted)] font-medium">
                Confidence
              </th>
              <th className="p-3 text-left text-xs text-[var(--muted)] font-medium">
                Difficulty
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-[var(--border)] ${
                  r.result_type === "correct"
                    ? "hover:bg-green-500/5"
                    : r.result_type === "collision"
                      ? "hover:bg-amber-500/5"
                      : "hover:bg-red-500/5"
                }`}
              >
                <td className="p-3">
                  <ScoreBadge type={r.result_type} />
                </td>
                <td className="p-3 text-sm max-w-xs truncate">
                  {r.test_cases?.request_text || "—"}
                </td>
                <td className="p-3 text-sm font-mono">
                  {r.test_cases?.expected_skill || "—"}
                </td>
                <td className="p-3 text-sm font-mono">
                  <span
                    className={
                      r.result_type === "correct"
                        ? "text-green-400"
                        : r.result_type === "collision"
                          ? "text-amber-400"
                          : "text-red-400"
                    }
                  >
                    {r.triggered_skill || "none"}
                  </span>
                </td>
                <td className="p-3 text-sm text-[var(--muted)]">
                  {r.confidence !== null
                    ? `${(r.confidence * 100).toFixed(1)}%`
                    : "—"}
                </td>
                <td className="p-3 text-sm text-[var(--muted)]">
                  {r.test_cases?.difficulty || "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-[var(--muted)]"
                >
                  No results matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Run metadata */}
      <div className="mt-6 text-xs text-[var(--muted)]">
        Run ID: {run.id} | Created:{" "}
        {new Date(run.created_at).toLocaleString()}
      </div>
    </div>
  );
}
