"use client";

import { useState } from "react";
import type { Difficulty } from "@/types";

interface TestCaseRowProps {
  id: string;
  request_text: string;
  expected_skill: string;
  expected_supporting: string[];
  should_not_trigger: string[];
  difficulty: string;
  cluster_tag: string | null;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}

export function TestCaseRow({
  id,
  request_text,
  expected_skill,
  expected_supporting,
  should_not_trigger,
  difficulty,
  cluster_tag,
  onUpdate,
  onDelete,
}: TestCaseRowProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    request_text,
    expected_skill,
    expected_supporting: expected_supporting.join(", "),
    should_not_trigger: should_not_trigger.join(", "),
    difficulty,
    cluster_tag: cluster_tag || "",
  });

  const difficultyColor = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  }[difficulty] || "text-gray-400";

  if (editing) {
    return (
      <tr className="border-b border-[var(--border)]">
        <td className="p-2">
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm"
            value={editData.request_text}
            onChange={(e) =>
              setEditData({ ...editData, request_text: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm"
            value={editData.expected_skill}
            onChange={(e) =>
              setEditData({ ...editData, expected_skill: e.target.value })
            }
          />
        </td>
        <td className="p-2">
          <select
            className="bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm"
            value={editData.difficulty}
            onChange={(e) =>
              setEditData({ ...editData, difficulty: e.target.value })
            }
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </td>
        <td className="p-2">
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 text-sm"
            value={editData.cluster_tag}
            onChange={(e) =>
              setEditData({ ...editData, cluster_tag: e.target.value })
            }
            placeholder="cluster tag"
          />
        </td>
        <td className="p-2 flex gap-1">
          <button
            className="px-2 py-1 text-xs bg-[var(--accent)] rounded hover:bg-[var(--accent-hover)]"
            onClick={() => {
              onUpdate(id, {
                request_text: editData.request_text,
                expected_skill: editData.expected_skill,
                difficulty: editData.difficulty as Difficulty,
                cluster_tag: editData.cluster_tag || null,
                expected_supporting: editData.expected_supporting
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                should_not_trigger: editData.should_not_trigger
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
              setEditing(false);
            }}
          >
            Save
          </button>
          <button
            className="px-2 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]">
      <td className="p-2 text-sm max-w-xs truncate">{request_text}</td>
      <td className="p-2 text-sm font-mono">{expected_skill}</td>
      <td className={`p-2 text-sm ${difficultyColor}`}>{difficulty}</td>
      <td className="p-2 text-sm text-[var(--muted)]">
        {cluster_tag || "—"}
      </td>
      <td className="p-2 flex gap-1">
        <button
          className="px-2 py-1 text-xs bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)]"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          className="px-2 py-1 text-xs text-[var(--danger)] bg-[var(--surface)] border border-[var(--border)] rounded hover:bg-[var(--surface-hover)]"
          onClick={() => onDelete(id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
