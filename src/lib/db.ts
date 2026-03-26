import { getSupabaseClient } from "./supabase";

// ── Libraries ──────────────────────────────────────────────

export interface LibraryInsert {
  name: string;
  description?: string | null;
}

export async function createLibrary(data: LibraryInsert) {
  const { data: row, error } = await getSupabaseClient()
    .from("libraries")
    .insert(data)
    .select()
    .single();
  if (error) throw new DatabaseError("createLibrary", error.message);
  return row;
}

export async function listLibraries() {
  const { data, error } = await getSupabaseClient()
    .from("libraries")
    .select()
    .order("created_at", { ascending: false });
  if (error) throw new DatabaseError("listLibraries", error.message);
  return data;
}

export async function getLibrary(id: string) {
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

export async function deleteLibrary(id: string) {
  const { error } = await getSupabaseClient()
    .from("libraries")
    .delete()
    .eq("id", id);
  if (error) throw new DatabaseError("deleteLibrary", error.message);
}

// ── Skills ─────────────────────────────────────────────────

export interface SkillInsert {
  library_id: string;
  name: string;
  description: string;
  trigger_phrases?: string[];
  content: string;
  token_count?: number;
  line_count?: number;
  source_filename?: string | null;
}

export async function bulkInsertSkills(skills: SkillInsert[]) {
  const { data, error } = await getSupabaseClient()
    .from("skills")
    .insert(skills)
    .select();
  if (error) throw new DatabaseError("bulkInsertSkills", error.message);
  return data;
}

export async function listSkillsByLibrary(libraryId: string) {
  const { data, error } = await getSupabaseClient()
    .from("skills")
    .select()
    .eq("library_id", libraryId)
    .order("name");
  if (error) throw new DatabaseError("listSkillsByLibrary", error.message);
  return data;
}

export async function getSkill(id: string) {
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
  updates: Record<string, unknown>
) {
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

export interface TestSetInsert {
  library_id: string;
  name: string;
  description?: string | null;
}

export async function createTestSet(data: TestSetInsert) {
  const { data: row, error } = await getSupabaseClient()
    .from("test_sets")
    .insert(data)
    .select()
    .single();
  if (error) throw new DatabaseError("createTestSet", error.message);
  return row;
}

export async function listTestSets(libraryId?: string) {
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

export async function getTestSet(id: string) {
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

export async function deleteTestSet(id: string) {
  const { error } = await getSupabaseClient()
    .from("test_sets")
    .delete()
    .eq("id", id);
  if (error) throw new DatabaseError("deleteTestSet", error.message);
}

// ── Test Cases ─────────────────────────────────────────────

export interface TestCaseInsert {
  test_set_id: string;
  request_text: string;
  expected_skill: string;
  expected_supporting?: string[];
  should_not_trigger?: string[];
  difficulty?: string;
  cluster_tag?: string | null;
}

export async function bulkInsertTestCases(cases: TestCaseInsert[]) {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .insert(cases)
    .select();
  if (error) throw new DatabaseError("bulkInsertTestCases", error.message);
  return data;
}

export async function listTestCases(testSetId: string) {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .select()
    .eq("test_set_id", testSetId)
    .order("created_at");
  if (error) throw new DatabaseError("listTestCases", error.message);
  return data;
}

export async function getTestCase(id: string) {
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
  updates: Record<string, unknown>
) {
  const { data, error } = await getSupabaseClient()
    .from("test_cases")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new DatabaseError("updateTestCase", error.message);
  return data;
}

export async function deleteTestCase(id: string) {
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
