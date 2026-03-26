import matter from "gray-matter";
import type { ParsedSkill } from "@/types";

/**
 * Estimate token count using a simple word-based heuristic.
 * Roughly 1 token per 0.75 words for English text.
 */
function estimateTokenCount(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 0.75);
}

/**
 * Parse a single SKILL.md file content into a ParsedSkill.
 *
 * Expected format:
 * ---
 * name: skill-name
 * description: What this skill does
 * trigger_phrases:
 *   - phrase one
 *   - phrase two
 * ---
 * (rest of content)
 */
export function parseSkillFile(
  fileContent: string,
  filename: string
): ParsedSkill {
  if (!fileContent.trim()) {
    throw new IngesterError(`Empty file: ${filename}`, filename);
  }

  const { data: frontmatter, content } = matter(fileContent);

  const name = frontmatter.name;
  if (!name || typeof name !== "string") {
    throw new IngesterError(
      `Missing or invalid 'name' in frontmatter: ${filename}`,
      filename
    );
  }

  const description = frontmatter.description;
  if (!description || typeof description !== "string") {
    throw new IngesterError(
      `Missing or invalid 'description' in frontmatter: ${filename}`,
      filename
    );
  }

  // trigger_phrases is optional, defaults to empty array
  let trigger_phrases: string[] = [];
  if (frontmatter.trigger_phrases) {
    if (Array.isArray(frontmatter.trigger_phrases)) {
      trigger_phrases = frontmatter.trigger_phrases.map(String);
    } else if (typeof frontmatter.trigger_phrases === "string") {
      trigger_phrases = [frontmatter.trigger_phrases];
    }
  }

  const trimmedContent = content.trim();
  const lineCount = trimmedContent ? trimmedContent.split("\n").length : 0;

  return {
    name: name.trim(),
    description: description.trim(),
    trigger_phrases,
    content: trimmedContent,
    token_count: estimateTokenCount(fileContent),
    line_count: lineCount,
    source_filename: filename,
  };
}

/**
 * Parse multiple SKILL.md files into ParsedSkill objects.
 * Returns both successful parses and errors for reporting.
 */
export function parseSkillFiles(
  files: { content: string; filename: string }[]
): ParseResult {
  const skills: ParsedSkill[] = [];
  const errors: IngesterError[] = [];

  for (const file of files) {
    try {
      skills.push(parseSkillFile(file.content, file.filename));
    } catch (err) {
      if (err instanceof IngesterError) {
        errors.push(err);
      } else {
        errors.push(
          new IngesterError(
            `Unexpected error parsing ${file.filename}: ${err}`,
            file.filename
          )
        );
      }
    }
  }

  return { skills, errors };
}

export interface ParseResult {
  skills: ParsedSkill[];
  errors: IngesterError[];
}

export class IngesterError extends Error {
  constructor(
    message: string,
    public readonly filename: string
  ) {
    super(message);
    this.name = "IngesterError";
  }
}
