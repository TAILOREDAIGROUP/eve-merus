"use client";

export function LoadingSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-[var(--surface)] rounded"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 border border-[var(--border)] rounded animate-pulse">
      <div className="h-8 w-16 bg-[var(--surface)] rounded mb-2" />
      <div className="h-3 w-24 bg-[var(--surface)] rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-[var(--border)] rounded overflow-hidden animate-pulse">
      <div className="h-10 bg-[var(--surface)]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 border-t border-[var(--border)] flex items-center gap-4 px-3"
        >
          <div className="h-4 w-20 bg-[var(--surface)] rounded" />
          <div className="h-4 w-40 bg-[var(--surface)] rounded" />
          <div className="h-4 w-16 bg-[var(--surface)] rounded" />
        </div>
      ))}
    </div>
  );
}
