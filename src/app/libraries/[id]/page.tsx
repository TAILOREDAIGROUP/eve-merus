"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { HealthGauge } from "@/components/health-gauge";
import { MetricCard } from "@/components/metric-card";
import { Sparkline } from "@/components/sparkline";
import { IssueCard } from "@/components/issue-card";

interface HealthData {
  total: number;
  routing_accuracy: number;
  collision_score: number;
  token_efficiency: number;
  dead_skills_score: number;
  has_scoring_data: boolean;
  breakdown: {
    routing_accuracy_raw: number;
    collision_rate_raw: number;
    avg_tokens_per_skill: number;
    dead_skill_pct: number;
  };
  history: { total: number; created_at: string }[];
}

interface LibraryInfo {
  id: string;
  name: string;
  description: string | null;
}

interface CollisionPair {
  skill_a: string;
  skill_b: string;
  overlap_pct: number;
  severity: string;
  recommendation: string;
}

export default function LibraryDashboard() {
  const params = useParams();
  const router = useRouter();
  const libraryId = params.id as string;

  const [library, setLibrary] = useState<LibraryInfo | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [skillCount, setSkillCount] = useState(0);
  const [testCaseCount, setTestCaseCount] = useState(0);
  const [topCollisions, setTopCollisions] = useState<CollisionPair[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [libRes, healthRes, skillsRes] = await Promise.all([
        fetch(`/api/libraries/${libraryId}`),
        fetch(`/api/libraries/${libraryId}/health`),
        fetch(`/api/libraries/${libraryId}/skills`),
      ]);

      if (libRes.ok) setLibrary(await libRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (skillsRes.ok) {
        const skills = await skillsRes.json();
        setSkillCount(skills.length);
      }

      // Fetch collision data
      const collisionRes = await fetch(
        `/api/libraries/${libraryId}/collisions`
      );
      if (collisionRes.ok) {
        const collisionData = await collisionRes.json();
        const pairs = collisionData.pairs || [];
        setTopCollisions(
          pairs.filter((p: CollisionPair) => p.overlap_pct > 15).slice(0, 3)
        );
      }

      // Fetch test case count
      const testSetsRes = await fetch(
        `/api/test-sets?library_id=${libraryId}`
      );
      if (testSetsRes.ok) {
        const testSets = await testSetsRes.json();
        let count = 0;
        for (const ts of testSets) {
          const casesRes = await fetch(`/api/test-sets/${ts.id}/cases`);
          if (casesRes.ok) {
            const cases = await casesRes.json();
            count += cases.length;
          }
        }
        setTestCaseCount(count);
      }
    } catch {
      // Silently handle errors
    }
    setLoading(false);
  }, [libraryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="p-8 text-[var(--muted)]">Loading dashboard...</div>;
  }

  if (!library) {
    return <div className="p-8 text-[var(--danger)]">Library not found</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{library.name}</h1>
        {library.description && (
          <p className="text-[var(--muted)] mt-1">{library.description}</p>
        )}
      </div>

      {/* Health Score + Trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-1 flex flex-col items-center">
          {health?.has_scoring_data ? (
            <HealthGauge score={health.total} />
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl font-bold text-[var(--muted)]">—</div>
              <div className="text-sm text-[var(--muted)] mt-2">
                Run a scoring test to calculate health
              </div>
            </div>
          )}
          <div className="text-xs text-[var(--muted)] mt-2">
            Library Health Score
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Component scores */}
          {health && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <MetricCard
                label="Routing Accuracy"
                value={health.routing_accuracy}
                detail={`${Math.round(health.breakdown.routing_accuracy_raw * 100)}% of test cases route correctly`}
              />
              <MetricCard
                label="Collision Freedom"
                value={health.collision_score}
                detail={`${Math.round(health.breakdown.collision_rate_raw * 100)}% collision rate`}
              />
              <MetricCard
                label="Token Efficiency"
                value={health.token_efficiency}
                detail={`${health.breakdown.avg_tokens_per_skill} avg tokens/skill`}
              />
              <MetricCard
                label="Live Skills"
                value={health.dead_skills_score}
                detail={`${health.breakdown.dead_skill_pct}% of skills are dead`}
              />
            </div>
          )}

          {/* Trend */}
          {health && health.history.length > 1 && (
            <div className="p-3 border border-[var(--border)] rounded">
              <div className="text-xs text-[var(--muted)] mb-2">
                Health Trend
              </div>
              <Sparkline
                data={health.history.map((h) => h.total)}
                width={400}
                height={50}
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="p-3 border border-[var(--border)] rounded text-center">
          <div className="text-xl font-bold">{skillCount}</div>
          <div className="text-xs text-[var(--muted)]">Skills</div>
        </div>
        <div className="p-3 border border-[var(--border)] rounded text-center">
          <div className="text-xl font-bold">{testCaseCount}</div>
          <div className="text-xs text-[var(--muted)]">Test Cases</div>
        </div>
        <div className="p-3 border border-[var(--border)] rounded text-center">
          <div className="text-xl font-bold">
            {health?.has_scoring_data ? "Yes" : "No"}
          </div>
          <div className="text-xs text-[var(--muted)]">Scored</div>
        </div>
        <div className="p-3 border border-[var(--border)] rounded text-center">
          <div className="text-xl font-bold">
            {topCollisions.length > 0 ? topCollisions.length : "0"}
          </div>
          <div className="text-xs text-[var(--muted)]">Active Issues</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <button
          className="px-4 py-2 bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)] text-sm"
          onClick={() => router.push(`/scoring`)}
        >
          Run Scoring Test
        </button>
        <button
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] text-sm"
          onClick={() =>
            router.push(`/libraries/${libraryId}/collisions`)
          }
        >
          Run Collision Analysis
        </button>
        <button
          className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] text-sm opacity-50 cursor-not-allowed"
          disabled
        >
          Start Optimization (Coming Soon)
        </button>
      </div>

      {/* Issues to Fix */}
      {(topCollisions.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Issues to Fix</h2>
          <div className="space-y-2">
            {topCollisions.map((p, i) => (
              <IssueCard
                key={i}
                type="collision"
                title={`${p.skill_a} ↔ ${p.skill_b} (${p.overlap_pct}% overlap)`}
                detail={p.recommendation}
                action="View in Collision Analysis →"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
