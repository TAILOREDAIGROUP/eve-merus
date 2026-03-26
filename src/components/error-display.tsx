"use client";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="p-6 border border-red-500/30 rounded bg-red-500/5 text-center">
      <div className="text-red-400 font-bold mb-2">Something went wrong</div>
      <p className="text-sm text-[var(--muted)] mb-4">{message}</p>
      {onRetry && (
        <button
          className="px-4 py-2 bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)] text-sm"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
