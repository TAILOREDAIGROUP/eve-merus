import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// Mock db module
vi.mock("@/lib/db", () => ({
  createLibrary: vi.fn(),
  bulkInsertSkills: vi.fn(),
}));

import { importSkillLibrary, ImportError } from "@/lib/import";
import * as db from "@/lib/db";

const mockDb = vi.mocked(db);

// Load actual fixture files
const FIXTURES_DIR = path.resolve(__dirname, "fixtures/skills");

function loadFixtures(): { content: string; filename: string }[] {
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".md"));
  return files.map((f) => ({
    content: fs.readFileSync(path.join(FIXTURES_DIR, f), "utf-8"),
    filename: f,
  }));
}

const MOCK_LIBRARY = {
  id: "lib-import-1",
  name: "Test Import Library",
  description: "Imported library",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("importSkillLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.createLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.bulkInsertSkills.mockImplementation(async (skills) =>
      skills.map((s, i) => ({
        id: `skill-${i}`,
        ...s,
        trigger_phrases: s.trigger_phrases || [],
        token_count: s.token_count || 0,
        line_count: s.line_count || 0,
        source_filename: s.source_filename || null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }))
    );
  });

  it("imports a full skills library from fixture files", async () => {
    const files = loadFixtures();
    expect(files.length).toBeGreaterThanOrEqual(7);

    const result = await importSkillLibrary({
      library_name: "Test Import Library",
      library_description: "Imported library",
      files,
    });

    expect(result.library.id).toBe("lib-import-1");
    expect(result.skills).toHaveLength(7);
    expect(result.parse_errors).toHaveLength(0);

    // Verify createLibrary was called correctly
    expect(mockDb.createLibrary).toHaveBeenCalledWith({
      name: "Test Import Library",
      description: "Imported library",
    });

    // Verify all skills were inserted with library_id
    expect(mockDb.bulkInsertSkills).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          library_id: "lib-import-1",
          name: "commit",
        }),
        expect.objectContaining({
          library_id: "lib-import-1",
          name: "review-pr",
        }),
        expect.objectContaining({
          library_id: "lib-import-1",
          name: "debug",
        }),
      ])
    );
  });

  it("extracts correct skill metadata from fixtures", async () => {
    const files = loadFixtures();
    const result = await importSkillLibrary({
      library_name: "Meta Test",
      files,
    });

    const commit = result.skills.find((s) => s.name === "commit");
    expect(commit).toBeDefined();
    expect(commit!.description).toContain("git commit");
    expect(commit!.trigger_phrases).toContain("commit my changes");
    expect(commit!.source_filename).toBe("commit.md");
  });

  it("handles mixed valid and invalid files", async () => {
    const files = [
      ...loadFixtures().slice(0, 3),
      { content: "", filename: "empty.md" },
      { content: "no frontmatter", filename: "broken.md" },
    ];

    const result = await importSkillLibrary({
      library_name: "Mixed",
      files,
    });

    expect(result.skills).toHaveLength(3);
    expect(result.parse_errors).toHaveLength(2);
    expect(result.parse_errors[0].filename).toBe("empty.md");
  });

  it("throws ImportError when library_name is missing", async () => {
    await expect(
      importSkillLibrary({
        library_name: "",
        files: [{ content: "x", filename: "x.md" }],
      })
    ).rejects.toThrow(ImportError);
  });

  it("throws ImportError when files array is empty", async () => {
    await expect(
      importSkillLibrary({
        library_name: "Test",
        files: [],
      })
    ).rejects.toThrow(ImportError);
  });

  it("throws ImportError when all files fail to parse", async () => {
    await expect(
      importSkillLibrary({
        library_name: "Test",
        files: [
          { content: "", filename: "a.md" },
          { content: "no front", filename: "b.md" },
        ],
      })
    ).rejects.toThrow("No valid skills found");
  });

  it("all 7 fixture files parse successfully standalone", () => {
    const files = loadFixtures();
    expect(files).toHaveLength(7);

    // Each fixture should have valid frontmatter
    for (const file of files) {
      expect(file.content).toContain("---");
      expect(file.content).toContain("name:");
      expect(file.content).toContain("description:");
    }
  });

  it("preserves token and line counts from parsing", async () => {
    const files = loadFixtures().slice(0, 1);
    const result = await importSkillLibrary({
      library_name: "Count Test",
      files,
    });

    const insertedSkills = mockDb.bulkInsertSkills.mock.calls[0][0];
    expect(insertedSkills[0].token_count).toBeGreaterThan(0);
    expect(insertedSkills[0].line_count).toBeGreaterThan(0);
  });
});

describe("ImportError", () => {
  it("is an instance of Error", () => {
    const err = new ImportError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ImportError");
  });
});
