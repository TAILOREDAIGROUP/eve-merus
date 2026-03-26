import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SCHEMA_PATH = path.resolve(
  __dirname,
  "../supabase/migrations/001_initial_schema.sql"
);

const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");

describe("Database Schema", () => {
  const expectedTables = [
    "libraries",
    "skills",
    "test_sets",
    "test_cases",
    "scoring_runs",
    "scoring_results",
    "optimization_runs",
    "experiments",
  ];

  it.each(expectedTables)("defines CREATE TABLE %s", (table) => {
    expect(schema).toContain(`CREATE TABLE ${table}`);
  });

  it("has 8 tables total", () => {
    const createCount = (schema.match(/CREATE TABLE/g) || []).length;
    expect(createCount).toBe(8);
  });

  it("all tables have UUID primary keys", () => {
    for (const table of expectedTables) {
      const tableRegex = new RegExp(
        `CREATE TABLE ${table}[^;]+id UUID PRIMARY KEY`,
        "s"
      );
      expect(schema).toMatch(tableRegex);
    }
  });

  it("skills table references libraries with CASCADE delete", () => {
    expect(schema).toContain(
      "REFERENCES libraries(id) ON DELETE CASCADE"
    );
  });

  it("test_cases has difficulty CHECK constraint", () => {
    expect(schema).toContain(
      "CHECK (difficulty IN ('easy', 'medium', 'hard'))"
    );
  });

  it("scoring_results has result_type CHECK constraint", () => {
    expect(schema).toContain(
      "CHECK (result_type IN ('correct', 'collision', 'wrong', 'miss'))"
    );
  });

  it("optimization_runs has status CHECK constraint", () => {
    expect(schema).toContain(
      "CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))"
    );
  });

  it("skills table has unique constraint on library_id + name", () => {
    expect(schema).toContain("UNIQUE(library_id, name)");
  });

  const expectedIndexes = [
    "idx_skills_library",
    "idx_test_cases_set",
    "idx_scoring_results_run",
    "idx_experiments_run",
    "idx_scoring_runs_library",
  ];

  it.each(expectedIndexes)("defines index %s", (idx) => {
    expect(schema).toContain(`CREATE INDEX ${idx}`);
  });

  it("has 5 indexes total", () => {
    const indexCount = (schema.match(/CREATE INDEX/g) || []).length;
    expect(indexCount).toBe(5);
  });
});
