"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, width = 200, height = 40 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-[var(--muted)]"
        style={{ width, height }}
      >
        Not enough data
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const trend = lastValue > firstValue ? "text-green-400" : lastValue < firstValue ? "text-red-400" : "text-[var(--muted)]";

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Current value dot */}
        <circle
          cx={parseFloat(points[points.length - 1].split(",")[0])}
          cy={parseFloat(points[points.length - 1].split(",")[1])}
          r="3"
          fill="var(--accent)"
        />
      </svg>
      <span className={`text-xs font-mono ${trend}`}>
        {lastValue > firstValue ? "+" : ""}
        {lastValue - firstValue}
      </span>
    </div>
  );
}
