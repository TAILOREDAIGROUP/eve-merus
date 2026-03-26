"use client";

interface HealthGaugeProps {
  score: number; // 0-100
  size?: number;
}

export function HealthGauge({ score, size = 200 }: HealthGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference * (1 - score / 100);

  let color = "stroke-green-400";
  let textColor = "text-green-400";
  let label = "Healthy";

  if (score < 60) {
    color = "stroke-red-400";
    textColor = "text-red-400";
    label = "Needs Work";
  } else if (score < 80) {
    color = "stroke-amber-400";
    textColor = "text-amber-400";
    label = "Fair";
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* Background arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 10 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 2 + 10}`}
          fill="none"
          className={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="-mt-16 text-center">
        <div className={`text-5xl font-bold ${textColor}`}>{score}</div>
        <div className="text-sm text-[var(--muted)] mt-1">{label}</div>
      </div>
    </div>
  );
}
