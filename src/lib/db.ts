import { getSupabaseClient } from "./supabase";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
type LibraryRow = Tables["libraries"]["Row"];
type LibraryInsert = Tables["libraries"]["Insert"];
type SkillRow = Tables["skills"]["Row"];
type SkillInsert = Tables["skills"]["Insert"];
type SkillUpdate = Tables["skills"]["Update"];
type TestSetRow = Tables["test_sets"]["Row"];
type TestSetInsert = Tables["test_sets"]["Insert"];
type TestCaseRow = Tables["test_cases"]["Row"];
type TestCaseInsert = Tables["test_cases"]["Insert"];
type TestCaseUpdate = Tables["test_cases"]["Update"];

// ── Libraries ──────────────────────────────────────────────

export async function createLibrary(
  data: LibraryInsert
): Promise<LibraryRow> {
  const { data: row, error } = await getSupabaseClient()
    .from("libraries")
    .insert(data)
    .select()
    .single();
  if (error) throw new DatabaseError("createLibrary", error.message);
  return row;
}

export async function listLibraries(): Promise<LibraryRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("libraries")
    .select()
    .order("created_at", { ascending: false });
  if (error) throw new DatabaseError("listLibraries", error.message);
  return data;
}

export async function getLibrary(id: string): Promise<LibraryRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("libraries")
    .select()
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    throw new DatabaseError("getLibrary", error.message);
  }
  return data;
}

export async function deleteLibrary(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("libraries")
    .delete()
    .eq("id", id);
  if (error) throw new DatabaseError("deleteLibrary", error.message);
}

// ── Skills ─────────────────────────────────────────────────

export async function bulkInsertSkills(
  skills: SkillInsert[]
): Promise<SkillRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("skills")
    .insert(skills)
    .select();
  if (error) throw new DatabaseError("bulkInsertSkills", error.message);
  return data;
}

export async function listSkillsByLibrary(
  libraryId: string
): Promise<SkillRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("skills")
    .select()
    .eq("library_id", libraryId)
    .order("name");
  if (error) throw new DatabaseError("listSkillsByLibrary", error.message);
  return data;
}

export async function getSkill(id: string): Promise<SkillRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("skills")
    .select()
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    throw new DatabaseError("getSkill", error.message);
  }
  return data;
}

export async function updateSkill(
  id: string,
  updates: SkillUpdate
): Promise<SkillRow> {
  const { data, error } = await getSupabaseClient()
    .from("skills")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new DatabaseError("updateSkill", error.message);
  return data;
}

// ── Test Sets ──────────────────────────────────────────────

export async function createTestSet(
  data: TestSetInsert
): Promise<TestSetRow> {
  const { data: row, error } = await getSupabaseClient()
    .from("test_sets")
    .insert(data)
    .select()
    .single();
  if (error) throw new DatabaseError("createTestSet", error.message);
  return row;
}

export async function listTestSets(
  libraryId?: string
): Promise<TestSetRow[]> {
  let query = getSupabaseClient()
    .from("test_sets")
    .select()
    .order("created_at", { ascending: false });
  if (libraryId) {
    query = query.eq("library_id", libraryId);
  }
  const { data, error } = await query;
  if (error) throw new DatabaseError("listTestSets", error.message);
  return data;
}

export async function getTestSet(id: string): Promise<TestSetRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("test_sets")
    .select()
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    throw new DatabaseError("getTestSet", error.message);
  }
  return data;
}

export async function deleteTestSet(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("test_sets")
    .delete()
    .eq("id", id);
  if (error) throw new DatabaseError("deleteTestSet", error.message);
}

// ── Test Cases ─────────────────────────────────────────────

export async function bulkInsertTestCases(
  cases: TestCaseInsert[]
): Promise<TestCaseRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .insert(cases)
    .select();
  if (error) throw new DatabaseError("bulkInsertTestCases", error.message);
  return data;
}

export async function listTestCases(
  testSetId: string
): Promise<TestCaseRow[]> {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .select()
    .eq("test_set_id", testSetId)
    .order("created_at");
  if (error) throw new DatabaseError("listTestCases", error.message);
  return data;
}

export async function getTestCase(id: string): Promise<TestCaseRow | null> {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .select()
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") {
    throw new DatabaseError("getTestCase", error.message);
  }
  return data;
}

export async function updateTestCase(
  id: string,
  updates: TestCaseUpdate
): Promise<TestCaseRow> {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new DatabaseError("updateTestCase", error.message);
  return data;
}

export async function deleteTestCase(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("test_cases")
    .delete()
    .eq("id", id);
  if (error) throw new DatabaseError("deleteTestCase", error.message);
}

// ── Error ──────────────────────────────────────────────────

export class DatabaseError extends Error {
  constructor(
    public readonly operation: string,
    message: string
  ) {
    super(`Database error in ${operation}: ${message}`);
    this.name = "DatabaseError";
  }
}
