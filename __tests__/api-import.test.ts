import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/import", () => ({
  importSkillLibrary: vi.fn(),
  ImportError: class ImportError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ImportError";
    }
  },
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-uuid-123' } }),
}));

import { POST } from "@/app/api/import/route";
import * as importModule from "@/lib/import";
import { NextRequest } from "next/server";

const mockImport = vi.mocked(importModule);

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/import", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/import", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 with import results on success", async () => {
    mockImport.importSkillLibrary.mockResolvedValue({
      library: {
        id: "lib-1",
        name: "Test",
        description: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      skills: [],
      parse_errors: [],
    });

    const res = await POST(
      makeReq({
        library_name: "Test",
        files: [{ content: "---\nname: x\ndescription: y\n---\nz", filename: "x.md" }],
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.library.name).toBe("Test");
  });

  it("returns 400 for ImportError", async () => {
    mockImport.importSkillLibrary.mockRejectedValue(
      new importModule.ImportError("no files")
    );

    const res = await POST(makeReq({ library_name: "", files: [] }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("no files");
  });

  it("returns 500 for unexpected errors", async () => {
    mockImport.importSkillLibrary.mockRejectedValue(
      new Error("db crashed")
    );

    const res = await POST(
      makeReq({ library_name: "Test", files: [{ content: "x", filename: "x.md" }] })
    );

    expect(res.status).toBe(500);
  });
});
