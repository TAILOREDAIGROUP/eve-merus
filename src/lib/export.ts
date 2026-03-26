/**
 * Export optimization experiments as TSV (tab-separated values).
 */

export interface ExperimentRow {
  id: string;
  change_type: string;
  old_description: string;
  new_description: string;
  accuracy_before: number;
  accuracy_after: number;
  collision_rate_before: number | null;
  collision_rate_after: number | null;
  kept: boolean;
  created_at: string;
}

const TSV_HEADERS = [
  "experiment_id",
  "change_type",
  "accuracy_before",
  "accuracy_after",
  "accuracy_delta",
  "collision_before",
  "collision_after",
  "collision_delta",
  "kept",
  "old_description",
  "new_description",
];

function escapeTsv(value: string): string {
  // Replace tabs and newlines to keep TSV format clean
  return value.replace(/[\t\n\r]/g, " ");
}

export function exportExperimentsToTsv(experiments: ExperimentRow[]): string {
  const lines: string[] = [TSV_HEADERS.join("\t")];

  for (const exp of experiments) {
    const accDelta = Math.round((exp.accuracy_after - exp.accuracy_before) * 10000) / 10000;
    const collBefore = exp.collision_rate_before ?? 0;
    const collAfter = exp.collision_rate_after ?? 0;
    const collDelta = Math.round((collAfter - collBefore) * 10000) / 10000;

    lines.push(
      [
        exp.id,
        exp.change_type,
        exp.accuracy_before.toFixed(4),
        exp.accuracy_after.toFixed(4),
        accDelta >= 0 ? `+${accDelta.toFixed(4)}` : accDelta.toFixed(4),
        collBefore.toFixed(4),
        collAfter.toFixed(4),
        collDelta >= 0 ? `+${collDelta.toFixed(4)}` : collDelta.toFixed(4),
        exp.kept ? "YES" : "NO",
        escapeTsv(exp.old_description),
        escapeTsv(exp.new_description),
      ].join("\t")
    );
  }

  return lines.join("\n");
}
