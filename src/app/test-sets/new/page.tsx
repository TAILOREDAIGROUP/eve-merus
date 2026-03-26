"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImportJsonButton } from "@/components/import-json-button";

export default function NewTestSetPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [libraryId, setLibraryId] = useState("");
  const [jsonCases, setJsonCases] = useState<unknown[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = (data: unknown) => {
    if (
      data &&
      typeof data === "object" &&
      "test_cases" in (data as Record<string, unknown>)
    ) {
      const imported = data as {
        name?: string;
        description?: string;
        library_id?: string;
        test_cases: unknown[];
      };
      setJsonCases(imported.test_cases);
      if (imported.name && !name) setName(imported.name);
      if (imported.description && !description)
        setDescription(imported.description);
      if (imported.library_id && !libraryId)
        setLibraryId(imported.library_id);
    } else if (Array.isArray(data)) {
      setJsonCases(data);
    } else {
      setError("Invalid JSON format. Expected {test_cases: [...]} or [...]");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !libraryId.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/test-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          library_id: libraryId.trim(),
          test_cases: jsonCases || [],
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create test set");
      }

      const body = await res.json();
      router.push(`/test-sets/${body.test_set.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Test Set</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">
            Name *
          </label>
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., golden-routing-test-v1"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">
            Description
          </label>
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this test set validates"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">
            Library ID *
          </label>
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 font-mono text-sm"
            value={libraryId}
            onChange={(e) => setLibraryId(e.target.value)}
            placeholder="UUID of the skills library"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <ImportJsonButton onImport={handleImport} />
          {jsonCases && (
            <span className="text-sm text-[var(--success)]">
              {jsonCases.length} test cases loaded from JSON
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Test Set"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
