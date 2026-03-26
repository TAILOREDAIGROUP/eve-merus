import { parseSkillFiles, type ParseResult } from "./ingester";
import { createLibrary, bulkInsertSkills } from "./db";
import type { Library, Skill } from "@/types";

export interface ImportInput {
  library_name: string;
  library_description?: string;
  files: { content: string; filename: string }[];
}

export interface ImportResult {
  library: Library;
  skills: Skill[];
  parse_errors: { filename: string; message: string }[];
}

/**
 * End-to-end import: parse SKILL.md files → create library → store skills.
 * Returns the created library, imported skills, and any parse errors.
 */
export async function importSkillLibrary(
  input: ImportInput
): Promise<ImportResult> {
  if (!input.library_name?.trim()) {
    throw new ImportError("library_name is required");
  }

  if (!input.files || input.files.length === 0) {
    throw new ImportError("At least one file is required");
  }

  // Step 1: Parse all files
  const parseResult: ParseResult = parseSkillFiles(input.files);

  if (parseResult.skills.length === 0) {
    throw new ImportError(
      `No valid skills found. ${parseResult.errors.length} file(s) failed to parse.`
    );
  }

  // Step 2: Create library
  const library = await createLibrary({
    name: input.library_name.trim(),
    description: input.library_description?.trim() || null,
  });

  // Step 3: Insert skills
  const skills = await bulkInsertSkills(
    parseResult.skills.map((s) => ({
      library_id: library.id,
      name: s.name,
      description: s.description,
      trigger_phrases: s.trigger_phrases,
      content: s.content,
      token_count: s.token_count,
      line_count: s.line_count,
      source_filename: s.source_filename,
    }))
  );

  return {
    library: library as Library,
    skills: skills as Skill[],
    parse_errors: parseResult.errors.map((e) => ({
      filename: e.filename,
      message: e.message,
    })),
  };
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}
