"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScoringRun {
  id: string;
  library_id: string;
  test_set_id: string;
  accuracy: number;
  collision_rate: number;
  total_cases: number;
  correct_count: number;
  created_at: string;
}

export default function ScoringRunsPage() {
  const [runs, setRuns] = useState<ScoringRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scoring-runs")
      .then((res) => res.json())
      .then((data) => {
        setRuns(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-[var(--muted)]">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Scoring Runs</h1>

      {runs.length === 0 ? (
        <p className="text-[var(--muted)]">
          No scoring runs yet. Run a test set against a library to see results.
        </p>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/scoring/${run.id}`}
              className="block p-4 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span
                    className={`text-2xl font-bold ${
                      run.accuracy >= 0.9
                        ? "text-green-400"
                        : run.accuracy >= 0.7
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {Math.round(run.accuracy * 100)}%
                  </span>
                  <div>
                    <div className="text-sm">
                      {run.correct_count}/{run.total_cases} correct
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      Collision rate: {Math.round(run.collision_rate * 100)}%
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(run.created_at).toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
