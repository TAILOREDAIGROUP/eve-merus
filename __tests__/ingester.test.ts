import { describe, it, expect } from "vitest";
import {
  parseSkillFile,
  parseSkillFiles,
  IngesterError,
} from "@/lib/ingester";

const VALID_SKILL = `---
name: commit
description: Create a git commit with a summary of changes
trigger_phrases:
  - commit my changes
  - make a commit
  - save my work
---
# Commit Skill

This skill creates a well-formatted git commit message based on staged changes.

## Steps
1. Run git diff --staged
2. Summarize changes
3. Create commit
`;

const MINIMAL_SKILL = `---
name: hello
description: Greet the user
---
Say hello.
`;

const NO_TRIGGERS_SKILL = `---
name: review
description: Review code changes
---
Review the code.
`;

const SINGLE_TRIGGER_STRING = `---
name: deploy
description: Deploy the application
trigger_phrases: deploy to production
---
Deploy steps here.
`;

describe("parseSkillFile", () => {
  it("parses a valid skill file with all fields", () => {
    const result = parseSkillFile(VALID_SKILL, "commit.md");

    expect(result.name).toBe("commit");
    expect(result.description).toBe(
      "Create a git commit with a summary of changes"
    );
    expect(result.trigger_phrases).toEqual([
      "commit my changes",
      "make a commit",
      "save my work",
    ]);
    expect(result.content).toContain("# Commit Skill");
    expect(result.content).toContain("Run git diff --staged");
    expect(result.source_filename).toBe("commit.md");
    expect(result.token_count).toBeGreaterThan(0);
    expect(result.line_count).toBeGreaterThan(0);
  });

  it("parses a minimal skill with only required fields", () => {
    const result = parseSkillFile(MINIMAL_SKILL, "hello.md");

    expect(result.name).toBe("hello");
    expect(result.description).toBe("Greet the user");
    expect(result.trigger_phrases).toEqual([]);
    expect(result.content).toBe("Say hello.");
  });

  it("defaults trigger_phrases to empty array when not provided", () => {
    const result = parseSkillFile(NO_TRIGGERS_SKILL, "review.md");
    expect(result.trigger_phrases).toEqual([]);
  });

  it("handles trigger_phrases as a single string", () => {
    const result = parseSkillFile(SINGLE_TRIGGER_STRING, "deploy.md");
    expect(result.trigger_phrases).toEqual(["deploy to production"]);
  });

  it("calculates line count from content body", () => {
    const result = parseSkillFile(VALID_SKILL, "commit.md");
    // Content has multiple lines
    expect(result.line_count).toBeGreaterThan(5);
  });

  it("calculates token count from full file", () => {
    const result = parseSkillFile(VALID_SKILL, "commit.md");
    // The file has many words, should have a reasonable token estimate
    expect(result.token_count).toBeGreaterThan(10);
    expect(result.token_count).toBeLessThan(500);
  });

  it("throws IngesterError for empty file", () => {
    expect(() => parseSkillFile("", "empty.md")).toThrow(IngesterError);
    expect(() => parseSkillFile("   \n  ", "blank.md")).toThrow(IngesterError);
  });

  it("throws IngesterError for missing name", () => {
    const noName = `---
description: A skill without a name
---
Content here.
`;
    expect(() => parseSkillFile(noName, "noname.md")).toThrow(IngesterError);
  });

  it("throws IngesterError for missing description", () => {
    const noDesc = `---
name: orphan
---
Content here.
`;
    expect(() => parseSkillFile(noDesc, "orphan.md")).toThrow(IngesterError);
  });

  it("throws IngesterError for non-string name", () => {
    const badName = `---
name: 123
description: Numeric name
---
Content.
`;
    // YAML parses 123 as a number, not a string
    expect(() => parseSkillFile(badName, "bad.md")).toThrow(IngesterError);
  });

  it("includes filename in IngesterError", () => {
    try {
      parseSkillFile("", "oops.md");
    } catch (err) {
      expect(err).toBeInstanceOf(IngesterError);
      expect((err as IngesterError).filename).toBe("oops.md");
    }
  });

  it("trims whitespace from name and description", () => {
    const padded = `---
name: "  padded  "
description: "  spaced out  "
---
Content.
`;
    const result = parseSkillFile(padded, "padded.md");
    expect(result.name).toBe("padded");
    expect(result.description).toBe("spaced out");
  });

  it("handles file with no content body", () => {
    const noBody = `---
name: empty-body
description: Skill with no content
---
`;
    const result = parseSkillFile(noBody, "nobody.md");
    expect(result.content).toBe("");
    expect(result.line_count).toBe(0);
  });
});

describe("parseSkillFiles", () => {
  it("parses multiple valid files", () => {
    const files = [
      { content: VALID_SKILL, filename: "commit.md" },
      { content: MINIMAL_SKILL, filename: "hello.md" },
    ];
    const result = parseSkillFiles(files);

    expect(result.skills).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.skills[0].name).toBe("commit");
    expect(result.skills[1].name).toBe("hello");
  });

  it("collects errors without stopping on failure", () => {
    const files = [
      { content: VALID_SKILL, filename: "commit.md" },
      { content: "", filename: "empty.md" },
      { content: MINIMAL_SKILL, filename: "hello.md" },
    ];
    const result = parseSkillFiles(files);

    expect(result.skills).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].filename).toBe("empty.md");
  });

  it("returns empty arrays for empty input", () => {
    const result = parseSkillFiles([]);
    expect(result.skills).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("handles all files failing", () => {
    const files = [
      { content: "", filename: "a.md" },
      { content: "   ", filename: "b.md" },
    ];
    const result = parseSkillFiles(files);

    expect(result.skills).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
  });
});
