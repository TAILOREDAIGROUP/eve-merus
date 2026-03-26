"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TestSetSummary {
  id: string;
  name: string;
  description: string | null;
  library_id: string;
  created_at: string;
}

export default function TestSetsPage() {
  const [testSets, setTestSets] = useState<TestSetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/test-sets")
      .then((res) => res.json())
      .then((data) => {
        setTestSets(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[var(--muted)]">Loading test sets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-[var(--danger)]">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Sets</h1>
        <Link
          href="/test-sets/new"
          className="px-3 py-2 text-sm bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)]"
        >
          + New Test Set
        </Link>
      </div>

      {testSets.length === 0 ? (
        <p className="text-[var(--muted)]">
          No test sets yet. Create one to start testing routing accuracy.
        </p>
      ) : (
        <div className="space-y-3">
          {testSets.map((ts) => (
            <Link
              key={ts.id}
              href={`/test-sets/${ts.id}`}
              className="block p-4 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{ts.name}</h2>
                  {ts.description && (
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {ts.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(ts.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
