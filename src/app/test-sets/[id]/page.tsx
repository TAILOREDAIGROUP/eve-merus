"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { TestCaseRow } from "@/components/test-case-row";
import { AddTestCaseForm } from "@/components/add-test-case-form";
import { ImportJsonButton } from "@/components/import-json-button";

interface TestSet {
  id: string;
  name: string;
  description: string | null;
  library_id: string;
}

interface TestCase {
  id: string;
  request_text: string;
  expected_skill: string;
  expected_supporting: string[];
  should_not_trigger: string[];
  difficulty: string;
  cluster_tag: string | null;
}

export default function TestSetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [testSet, setTestSet] = useState<TestSet | null>(null);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tsRes, casesRes] = await Promise.all([
        fetch(`/api/test-sets/${id}`),
        fetch(`/api/test-sets/${id}/cases`),
      ]);

      if (!tsRes.ok) throw new Error("Test set not found");

      setTestSet(await tsRes.json());
      setCases(await casesRes.json());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateCase = async (
    caseId: string,
    data: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/test-cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setCases((prev) =>
          prev.map((c) => (c.id === caseId ? updated : c))
        );
      }
    } catch {
      // Silently fail, user can retry
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      const res = await fetch(`/api/test-cases/${caseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCases((prev) => prev.filter((c) => c.id !== caseId));
      }
    } catch {
      // Silently fail
    }
  };

  const handleAddCase = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/test-sets/${id}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_cases: [data] }),
      });
      if (res.ok) {
        const body = await res.json();
        setCases((prev) => [...prev, ...body.cases]);
      }
    } catch {
      // Silently fail
    }
  };

  const handleImportJson = async (data: unknown) => {
    let casesToImport: unknown[];
    if (
      data &&
      typeof data === "object" &&
      "test_cases" in (data as Record<string, unknown>)
    ) {
      casesToImport = (data as { test_cases: unknown[] }).test_cases;
    } else if (Array.isArray(data)) {
      casesToImport = data;
    } else {
      alert("Invalid JSON format");
      return;
    }

    try {
      const res = await fetch(`/api/test-sets/${id}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_cases: casesToImport }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      // Silently fail
    }
  };

  const handleExport = () => {
    window.open(`/api/test-sets/${id}/export`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-[var(--muted)]">Loading...</p>
      </div>
    );
  }

  if (error || !testSet) {
    return (
      <div className="p-8">
        <p className="text-[var(--danger)]">{error || "Not found"}</p>
      </div>
    );
  }

  // Group by cluster tag for summary
  const clusters = new Map<string, number>();
  const difficulties = { easy: 0, medium: 0, hard: 0 };
  for (const c of cases) {
    const tag = c.cluster_tag || "uncategorized";
    clusters.set(tag, (clusters.get(tag) || 0) + 1);
    if (c.difficulty in difficulties) {
      difficulties[c.difficulty as keyof typeof difficulties]++;
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{testSet.name}</h1>
          {testSet.description && (
            <p className="text-[var(--muted)] mt-1">{testSet.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ImportJsonButton onImport={handleImportJson} />
          <button
            className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)]"
            onClick={handleExport}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3 border border-[var(--border)] rounded">
          <div className="text-2xl font-bold">{cases.length}</div>
          <div className="text-xs text-[var(--muted)]">Total Cases</div>
        </div>
        <div className="p-3 border border-[var(--border)] rounded">
          <div className="text-2xl font-bold text-green-400">
            {difficulties.easy}
          </div>
          <div className="text-xs text-[var(--muted)]">Easy</div>
        </div>
        <div className="p-3 border border-[var(--border)] rounded">
          <div className="text-2xl font-bold text-yellow-400">
            {difficulties.medium}
          </div>
          <div className="text-xs text-[var(--muted)]">Medium</div>
        </div>
        <div className="p-3 border border-[var(--border)] rounded">
          <div className="text-2xl font-bold text-red-400">
            {difficulties.hard}
          </div>
          <div className="text-xs text-[var(--muted)]">Hard</div>
        </div>
      </div>

      {/* Cluster tags */}
      {clusters.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from(clusters.entries()).map(([tag, count]) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded"
            >
              {tag} ({count})
            </span>
          ))}
        </div>
      )}

      {/* Test cases table */}
      <div className="border border-[var(--border)] rounded overflow-hidden mb-4">
        <table className="w-full">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="p-2 text-left text-xs text-[var(--muted)] font-medium">
                Request
              </th>
              <th className="p-2 text-left text-xs text-[var(--muted)] font-medium">
                Expected Skill
              </th>
              <th className="p-2 text-left text-xs text-[var(--muted)] font-medium">
                Difficulty
              </th>
              <th className="p-2 text-left text-xs text-[var(--muted)] font-medium">
                Cluster
              </th>
              <th className="p-2 text-left text-xs text-[var(--muted)] font-medium w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {cases.map((tc) => (
              <TestCaseRow
                key={tc.id}
                {...tc}
                onUpdate={handleUpdateCase}
                onDelete={handleDeleteCase}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add case form */}
      <AddTestCaseForm onAdd={handleAddCase} />
    </div>
  );
}
