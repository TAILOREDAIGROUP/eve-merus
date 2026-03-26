"use client";

interface MetricCardProps {
  label: string;
  value: number; // 0-100
  detail?: string;
}

export function MetricCard({ label, value, detail }: MetricCardProps) {
  let color = "text-green-400";
  if (value < 60) color = "text-red-400";
  else if (value < 80) color = "text-amber-400";

  return (
    <div className="p-4 border border-[var(--border)] rounded bg-[var(--surface)]">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-[var(--muted)] mt-1">{label}</div>
      {detail && (
        <div className="text-xs text-[var(--muted)] mt-0.5 opacity-70">
          {detail}
        </div>
      )}
    </div>
  );
}
