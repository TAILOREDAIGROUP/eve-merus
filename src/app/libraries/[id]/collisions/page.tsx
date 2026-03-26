"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CollisionHeatmap } from "@/components/collision-heatmap";
import { CollisionList } from "@/components/collision-list";

interface CollisionData {
  id: string;
  total_pairs: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  clean_count: number;
  overall_collision_score: number;
  pairs: Array<{
    skill_a: string;
    skill_b: string;
    overlap_pct: number;
    shared_keywords: string[];
    shared_triggers: string[];
    severity: string;
    recommendation: string;
  }>;
  created_at: string;
}

export default function CollisionsPage() {
  const params = useParams();
  const libraryId = params.id as string;

  const [data, setData] = useState<CollisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/libraries/${libraryId}/collisions`);
      if (res.status === 404) {
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [libraryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runAnalysis = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/libraries/${libraryId}/collisions`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Analysis failed");
      }
      const body = await res.json();
      setData(body.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
    setRunning(false);
  };

  // Extract unique skill names from pairs
  const skillNames = data
    ? Array.from(
        new Set(data.pairs.flatMap((p) => [p.skill_a, p.skill_b]))
      ).sort()
    : [];

  if (loading) {
    return <div className="p-8 text-[var(--muted)]">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Collision Analysis</h1>
          {data && (
            <p className="text-sm text-[var(--muted)] mt-1">
              Last run: {new Date(data.created_at).toLocaleString()}
            </p>
          )}
        </div>
        <button
          className="px-4 py-2 bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
          onClick={runAnalysis}
          disabled={running}
        >
          {running ? "Analyzing..." : "Run Collision Analysis"}
        </button>
      </div>

      {error && (
        <p className="text-[var(--danger)] text-sm mb-4">{error}</p>
      )}

      {!data ? (
        <div className="text-center py-16 border border-[var(--border)] rounded">
          <p className="text-[var(--muted)] mb-4">
            No collision analysis has been run yet.
          </p>
          <button
            className="px-4 py-2 bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)]"
            onClick={runAnalysis}
            disabled={running}
          >
            Run First Analysis
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-3 mb-8">
            <div className="p-3 border border-[var(--border)] rounded text-center">
              <div className="text-2xl font-bold">
                {data.overall_collision_score}
              </div>
              <div className="text-xs text-[var(--muted)]">Collision Score</div>
            </div>
            <div className="p-3 border border-red-500/30 rounded text-center">
              <div className="text-2xl font-bold text-red-400">
                {data.critical_count}
              </div>
              <div className="text-xs text-[var(--muted)]">Critical</div>
            </div>
            <div className="p-3 border border-amber-500/30 rounded text-center">
              <div className="text-2xl font-bold text-amber-400">
                {data.high_count}
              </div>
              <div className="text-xs text-[var(--muted)]">High</div>
            </div>
            <div className="p-3 border border-yellow-500/30 rounded text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {data.medium_count}
              </div>
              <div className="text-xs text-[var(--muted)]">Medium</div>
            </div>
            <div className="p-3 border border-green-500/30 rounded text-center">
              <div className="text-2xl font-bold text-green-400">
                {data.clean_count}
              </div>
              <div className="text-xs text-[var(--muted)]">Clean</div>
            </div>
          </div>

          {/* Heatmap */}
          <h2 className="text-lg font-bold mb-3">Overlap Heatmap</h2>
          <CollisionHeatmap skills={skillNames} pairs={data.pairs} />

          {/* Ranked list */}
          <h2 className="text-lg font-bold mt-8 mb-3">
            Collision Pairs (Ranked)
          </h2>
          <CollisionList pairs={data.pairs} />
        </>
      )}
    </div>
  );
}
