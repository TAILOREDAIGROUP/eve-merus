import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">EVE Merus</h1>
        <p className="text-[var(--muted)] mt-2">
          AI Skills Library Optimizer — undiluted optimization, nothing extra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/test-sets"
          className="p-6 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
        >
          <div className="text-lg font-bold mb-1">Test Sets</div>
          <p className="text-sm text-[var(--muted)]">
            Create and manage golden routing test sets
          </p>
        </Link>

        <Link
          href="/scoring"
          className="p-6 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
        >
          <div className="text-lg font-bold mb-1">Scoring</div>
          <p className="text-sm text-[var(--muted)]">
            Run routing accuracy tests and view results
          </p>
        </Link>

        <div className="p-6 border border-[var(--border)] rounded">
          <div className="text-lg font-bold mb-1">Quick Start</div>
          <p className="text-sm text-[var(--muted)]">
            1. Import a skills library
            <br />
            2. Create a test set
            <br />
            3. Run scoring
            <br />
            4. Optimize
          </p>
        </div>
      </div>
    </div>
  );
}
