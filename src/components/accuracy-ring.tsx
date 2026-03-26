"use client";

interface AccuracyRingProps {
  value: number; // 0-1
  label: string;
  size?: number;
}

export function AccuracyRing({ value, label, size = 120 }: AccuracyRingProps) {
  const pct = Math.round(value * 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  let color = "stroke-green-400";
  if (pct < 70) color = "stroke-red-400";
  else if (pct < 90) color = "stroke-amber-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="text-center -mt-[calc(50%+16px)]" style={{ marginTop: `-${size / 2 + 16}px` }}>
        <div className="text-2xl font-bold">{pct}%</div>
      </div>
      <div className="text-xs text-[var(--muted)] mt-4">{label}</div>
    </div>
  );
}
