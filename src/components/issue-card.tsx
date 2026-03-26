"use client";

type IssueType = "collision" | "routing" | "dead";

const ICONS: Record<IssueType, string> = {
  collision: "!!",
  routing: "?",
  dead: "x",
};

const COLORS: Record<IssueType, string> = {
  collision: "border-amber-500/30 bg-amber-500/5",
  routing: "border-red-500/30 bg-red-500/5",
  dead: "border-[var(--muted)] bg-[var(--surface)]",
};

interface IssueCardProps {
  type: IssueType;
  title: string;
  detail: string;
  action?: string;
}

export function IssueCard({ type, title, detail, action }: IssueCardProps) {
  return (
    <div className={`p-3 border rounded ${COLORS[type]}`}>
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono font-bold bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
          {ICONS[type]}
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-[var(--muted)] mt-0.5">{detail}</div>
          {action && (
            <div className="text-xs text-[var(--accent)] mt-1">{action}</div>
          )}
        </div>
      </div>
    </div>
  );
}
