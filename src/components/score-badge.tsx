"use client";

type ResultType = "correct" | "collision" | "wrong" | "miss";

const COLORS: Record<ResultType, string> = {
  correct: "bg-green-500/20 text-green-400 border-green-500/30",
  collision: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  wrong: "bg-red-500/20 text-red-400 border-red-500/30",
  miss: "bg-red-500/20 text-red-400 border-red-500/30",
};

const LABELS: Record<ResultType, string> = {
  correct: "CORRECT",
  collision: "COLLISION",
  wrong: "WRONG",
  miss: "MISS",
};

export function ScoreBadge({ type }: { type: ResultType }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-mono font-bold rounded border ${COLORS[type]}`}
    >
      {LABELS[type]}
    </span>
  );
}
