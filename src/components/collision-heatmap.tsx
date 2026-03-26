"use client";

import { useState } from "react";

interface CollisionPair {
  skill_a: string;
  skill_b: string;
  overlap_pct: number;
  shared_keywords: string[];
  shared_triggers: string[];
  severity: string;
  recommendation: string;
}

interface HeatmapProps {
  skills: string[];
  pairs: CollisionPair[];
}

function getCellColor(pct: number): string {
  if (pct > 50) return "bg-red-500/60";
  if (pct > 30) return "bg-amber-500/50";
  if (pct > 15) return "bg-yellow-500/40";
  if (pct > 0) return "bg-green-500/20";
  return "bg-[var(--surface)]";
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "text-red-400 bg-red-500/15 border-red-500/30";
    case "HIGH": return "text-amber-400 bg-amber-500/15 border-amber-500/30";
    case "MEDIUM": return "text-yellow-400 bg-yellow-500/15 border-yellow-500/30";
    default: return "text-green-400 bg-green-500/15 border-green-500/30";
  }
}

export function CollisionHeatmap({ skills, pairs }: HeatmapProps) {
  const [selected, setSelected] = useState<CollisionPair | null>(null);

  // Build lookup map
  const pairMap = new Map<string, CollisionPair>();
  for (const p of pairs) {
    pairMap.set(`${p.skill_a}:${p.skill_b}`, p);
    pairMap.set(`${p.skill_b}:${p.skill_a}`, p);
  }

  const getOverlap = (a: string, b: string): number => {
    if (a === b) return 100;
    return pairMap.get(`${a}:${b}`)?.overlap_pct || 0;
  };

  const getPair = (a: string, b: string): CollisionPair | undefined => {
    return pairMap.get(`${a}:${b}`);
  };

  return (
    <div className="space-y-6">
      {/* Heatmap matrix */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Header row */}
          <div className="flex">
            <div className="w-28 shrink-0" />
            {skills.map((s) => (
              <div
                key={s}
                className="w-20 h-20 flex items-end justify-center pb-1"
              >
                <span className="text-xs text-[var(--muted)] -rotate-45 origin-bottom-left whitespace-nowrap">
                  {s}
                </span>
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {skills.map((rowSkill) => (
            <div key={rowSkill} className="flex">
              <div className="w-28 shrink-0 flex items-center pr-2">
                <span className="text-xs font-mono truncate">
                  {rowSkill}
                </span>
              </div>
              {skills.map((colSkill) => {
                const overlap = getOverlap(rowSkill, colSkill);
                const isDiagonal = rowSkill === colSkill;
                const pair = getPair(rowSkill, colSkill);

                return (
                  <div
                    key={colSkill}
                    className={`w-20 h-10 flex items-center justify-center border border-[var(--border)] text-xs font-mono cursor-pointer transition-all ${
                      isDiagonal
                        ? "bg-[var(--surface)] text-[var(--muted)]"
                        : getCellColor(overlap)
                    } ${
                      selected && pair === selected
                        ? "ring-2 ring-[var(--accent)]"
                        : "hover:ring-1 hover:ring-[var(--accent)]"
                    }`}
                    onClick={() => {
                      if (!isDiagonal && pair) setSelected(pair);
                    }}
                  >
                    {isDiagonal ? "—" : `${overlap}%`}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500/60 rounded" /> &gt;50% Critical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-amber-500/50 rounded" /> 30-50% High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-500/40 rounded" /> 15-30% Medium
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500/20 rounded" /> &lt;15% Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-[var(--surface)] border border-[var(--border)] rounded" /> 0%
        </span>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="border border-[var(--border)] rounded p-4 bg-[var(--surface)]">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-sm">
                {selected.skill_a} ↔ {selected.skill_b}
              </h3>
              <span
                className={`inline-block px-2 py-0.5 mt-1 text-xs font-bold rounded border ${getSeverityColor(selected.severity)}`}
              >
                {selected.severity} — {selected.overlap_pct}% overlap
              </span>
            </div>
            <button
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          {selected.shared_keywords.length > 0 && (
            <div className="mb-2">
              <span className="text-xs text-[var(--muted)]">Shared keywords: </span>
              <span className="text-xs font-mono">
                {selected.shared_keywords.join(", ")}
              </span>
            </div>
          )}

          {selected.shared_triggers.length > 0 && (
            <div className="mb-2">
              <span className="text-xs text-[var(--muted)]">Shared triggers: </span>
              <span className="text-xs font-mono">
                {selected.shared_triggers.join(", ")}
              </span>
            </div>
          )}

          <div className="mt-3 p-2 bg-[var(--background)] rounded text-xs">
            {selected.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}
