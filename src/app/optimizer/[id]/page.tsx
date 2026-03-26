"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AccuracyRing } from "@/components/accuracy-ring";

interface OptRun {
  id: string;
  status: string;
  iterations_completed: number;
  accuracy_start: number;
  accuracy_end: number;
  collision_rate_start: number;
  collision_rate_end: number;
  started_at: string;
  completed_at: string | null;
}

interface Experiment {
  id: string;
  skill_id: string;
  change_type: string;
  old_description: string;
  new_description: string;
  accuracy_before: number;
  accuracy_after: number;
  collision_rate_before: number;
  collision_rate_after: number;
  kept: boolean;
  created_at: string;
}

export default function OptimizationResultPage() {
  const params = useParams();
  const id = params.id as string;

  const [run, setRun] = useState<OptRun | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/optimizer/runs/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setRun(data.run);
      setExperiments(data.experiments);
    } catch {
      // Silent
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="p-8 text-[var(--muted)]">Loading...</div>;
  if (!run) return <div className="p-8 text-[var(--danger)]">Not found</div>;

  const kept = experiments.filter((e) => e.kept);
  const reverted = experiments.filter((e) => !e.kept);
  const accDelta = Math.round((run.accuracy_end - run.accuracy_start) * 100);
  const collDelta = Math.round(
    (run.collision_rate_start - run.collision_rate_end) * 100
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Optimization Results</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        {run.iterations_completed} iterations | {experiments.length} experiments |{" "}
        {run.completed_at
          ? new Date(run.completed_at).toLocaleString()
          : "In progress"}
      </p>

      {/* Before / After summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <AccuracyRing value={run.accuracy_start} label="Accuracy Before" />
        <AccuracyRing value={run.accuracy_end} label="Accuracy After" />
        <div className="flex flex-col items-center justify-center p-4 border border-[var(--border)] rounded">
          <div
            className={`text-3xl font-bold ${accDelta > 0 ? "text-green-400" : accDelta < 0 ? "text-red-400" : "text-[var(--muted)]"}`}
          >
            {accDelta > 0 ? "+" : ""}
            {accDelta}%
          </div>
          <div className="text-xs text-[var(--muted)]">Accuracy Change</div>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border border-[var(--border)] rounded">
          <div
            className={`text-3xl font-bold ${collDelta > 0 ? "text-green-400" : collDelta < 0 ? "text-red-400" : "text-[var(--muted)]"}`}
          >
            {collDelta > 0 ? "-" : "+"}
            {Math.abs(collDelta)}%
          </div>
          <div className="text-xs text-[var(--muted)]">Collision Change</div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-green-400">{kept.length} kept</span>
        <span className="text-red-400">{reverted.length} reverted</span>
        <span className="text-[var(--muted)]">
          {experiments.length} total experiments
        </span>
      </div>

      {/* Experiment log */}
      <h2 className="text-lg font-bold mb-3">Experiment Log</h2>
      <div className="space-y-2">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className={`border rounded ${
              exp.kept
                ? "border-green-500/30 bg-green-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <div
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() =>
                setExpanded(expanded === exp.id ? null : exp.id)
              }
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    exp.kept
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {exp.kept ? "KEPT" : "REVERTED"}
                </span>
                <span className="text-sm font-mono">{exp.change_type}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                <span>
                  Accuracy: {Math.round(exp.accuracy_before * 100)}% →{" "}
                  {Math.round(exp.accuracy_after * 100)}%
                </span>
                <span>{expanded === exp.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {expanded === exp.id && (
              <div className="px-3 pb-3 border-t border-[var(--border)]">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">
                      Old Description
                    </div>
                    <div className="text-xs bg-[var(--background)] p-2 rounded font-mono whitespace-pre-wrap">
                      {exp.old_description}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">
                      New Description
                    </div>
                    <div className="text-xs bg-[var(--background)] p-2 rounded font-mono whitespace-pre-wrap">
                      {exp.new_description}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-[var(--muted)]">
                  Collision rate: {Math.round(exp.collision_rate_before * 100)}%
                  → {Math.round(exp.collision_rate_after * 100)}%
                </div>
              </div>
            )}
          </div>
        ))}

        {experiments.length === 0 && (
          <p className="text-[var(--muted)] text-sm py-4 text-center">
            No experiments were run (library may already be optimal).
          </p>
        )}
      </div>
    </div>
  );
}
