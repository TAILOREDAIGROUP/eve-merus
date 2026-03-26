"use client";

import { useState } from "react";
import type { Difficulty } from "@/types";

interface AddTestCaseFormProps {
  onAdd: (data: {
    request_text: string;
    expected_skill: string;
    difficulty: Difficulty;
    cluster_tag: string | null;
    expected_supporting: string[];
    should_not_trigger: string[];
  }) => void;
}

export function AddTestCaseForm({ onAdd }: AddTestCaseFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    request_text: "",
    expected_skill: "",
    difficulty: "medium" as Difficulty,
    cluster_tag: "",
    expected_supporting: "",
    should_not_trigger: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.request_text.trim() || !form.expected_skill.trim()) return;

    onAdd({
      request_text: form.request_text.trim(),
      expected_skill: form.expected_skill.trim(),
      difficulty: form.difficulty,
      cluster_tag: form.cluster_tag.trim() || null,
      expected_supporting: form.expected_supporting
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      should_not_trigger: form.should_not_trigger
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });

    setForm({
      request_text: "",
      expected_skill: "",
      difficulty: "medium",
      cluster_tag: "",
      expected_supporting: "",
      should_not_trigger: "",
    });
  };

  if (!open) {
    return (
      <button
        className="px-3 py-2 text-sm bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)]"
        onClick={() => setOpen(true)}
      >
        + Add Test Case
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[var(--border)] rounded p-4 space-y-3 bg-[var(--surface)]"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Request Text *
          </label>
          <input
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={form.request_text}
            onChange={(e) =>
              setForm({ ...form, request_text: e.target.value })
            }
            placeholder="e.g., commit my changes"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Expected Skill *
          </label>
          <input
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={form.expected_skill}
            onChange={(e) =>
              setForm({ ...form, expected_skill: e.target.value })
            }
            placeholder="e.g., commit"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Difficulty
          </label>
          <select
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={form.difficulty}
            onChange={(e) =>
              setForm({ ...form, difficulty: e.target.value as Difficulty })
            }
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Cluster Tag
          </label>
          <input
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={form.cluster_tag}
            onChange={(e) =>
              setForm({ ...form, cluster_tag: e.target.value })
            }
            placeholder="e.g., git-operations"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Expected Supporting (comma-separated)
          </label>
          <input
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={form.expected_supporting}
            onChange={(e) =>
              setForm({ ...form, expected_supporting: e.target.value })
            }
            placeholder="e.g., git, explain"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)] mb-1">
            Should Not Trigger (comma-separated)
          </label>
          <input
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
            value={form.should_not_trigger}
            onChange={(e) =>
              setForm({ ...form, should_not_trigger: e.target.value })
            }
            placeholder="e.g., deploy, commit"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-2 text-sm bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)]"
        >
          Add Case
        </button>
        <button
          type="button"
          className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
