"use client";

interface CollisionPair {
  skill_a: string;
  skill_b: string;
  overlap_pct: number;
  shared_keywords: string[];
  severity: string;
  recommendation: string;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "text-red-400";
    case "HIGH": return "text-amber-400";
    case "MEDIUM": return "text-yellow-400";
    default: return "text-green-400";
  }
}

export function CollisionList({ pairs }: { pairs: CollisionPair[] }) {
  const significant = pairs.filter((p) => p.overlap_pct > 0);

  if (significant.length === 0) {
    return (
      <p className="text-[var(--muted)] text-sm">
        No collisions detected. All skills are well-separated.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {significant.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)]"
        >
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold ${getSeverityColor(p.severity)}`}>
              {p.overlap_pct}%
            </span>
            <span className="text-sm">
              <span className="font-mono">{p.skill_a}</span>
              <span className="text-[var(--muted)]"> ↔ </span>
              <span className="font-mono">{p.skill_b}</span>
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${getSeverityColor(p.severity)} bg-opacity-10`}>
              {p.severity}
            </span>
          </div>
          <span className="text-xs text-[var(--muted)] max-w-sm truncate">
            {p.recommendation}
          </span>
        </div>
      ))}
    </div>
  );
}
