import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  getLibrary: vi.fn(),
  bulkInsertSkills: vi.fn(),
  listSkillsByLibrary: vi.fn(),
  getSkill: vi.fn(),
  updateSkill: vi.fn(),
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-uuid-123' } }),
}));

import { POST, GET } from "@/app/api/libraries/[id]/skills/route";
import {
  GET as GET_SKILL,
  PUT,
} from "@/app/api/skills/[id]/route";
import * as db from "@/lib/db";
import { NextRequest } from "next/server";

const mockDb = vi.mocked(db);

const MOCK_LIBRARY = {
  id: "lib-1",
  name: "Test",
  description: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MOCK_SKILL = {
  id: "skill-1",
  library_id: "lib-1",
  name: "commit",
  description: "Create a git commit",
  trigger_phrases: ["commit changes"],
  content: "# Commit\nDo the commit.",
  token_count: 10,
  line_count: 2,
  source_filename: "commit.md",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function makeParams(id: string) {
  return Promise.resolve({ id });
}

function makeReq(url: string, body?: unknown, method = "POST"): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(url, init);
}

describe("POST /api/libraries/[id]/skills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("bulk imports skills into a library", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.bulkInsertSkills.mockResolvedValue([MOCK_SKILL]);

    const res = await POST(
      makeReq("http://localhost/api/libraries/lib-1/skills", {
        skills: [
          {
            name: "commit",
            description: "Create a git commit",
            content: "# Commit",
            trigger_phrases: ["commit changes"],
            token_count: 10,
            line_count: 2,
            source_filename: "commit.md",
          },
        ],
      }),
      { params: makeParams("lib-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.imported).toBe(1);
    expect(body.skills[0].name).toBe("commit");
    expect(mockDb.bulkInsertSkills).toHaveBeenCalledWith([
      expect.objectContaining({
        library_id: "lib-1",
        name: "commit",
      }),
    ]);
  });

  it("returns 404 when library not found", async () => {
    mockDb.getLibrary.mockResolvedValue(null);

    const res = await POST(
      makeReq("http://localhost/api/libraries/nope/skills", {
        skills: [{ name: "x", description: "x", content: "x" }],
      }),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 when skills array is empty", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);

    const res = await POST(
      makeReq("http://localhost/api/libraries/lib-1/skills", { skills: [] }),
      { params: makeParams("lib-1") }
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when skills is not an array", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);

    const res = await POST(
      makeReq("http://localhost/api/libraries/lib-1/skills", {
        skills: "not-array",
      }),
      { params: makeParams("lib-1") }
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when a skill is missing required fields", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);

    const res = await POST(
      makeReq("http://localhost/api/libraries/lib-1/skills", {
        skills: [{ name: "incomplete" }],
      }),
      { params: makeParams("lib-1") }
    );

    expect(res.status).toBe(400);
  });

  it("defaults optional fields", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.bulkInsertSkills.mockResolvedValue([MOCK_SKILL]);

    await POST(
      makeReq("http://localhost/api/libraries/lib-1/skills", {
        skills: [
          { name: "minimal", description: "desc", content: "body" },
        ],
      }),
      { params: makeParams("lib-1") }
    );

    expect(mockDb.bulkInsertSkills).toHaveBeenCalledWith([
      expect.objectContaining({
        trigger_phrases: [],
        token_count: 0,
        line_count: 0,
        source_filename: null,
      }),
    ]);
  });
});

describe("GET /api/libraries/[id]/skills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists skills for a library", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.listSkillsByLibrary.mockResolvedValue([MOCK_SKILL]);

    const res = await GET(
      new NextRequest("http://localhost/api/libraries/lib-1/skills"),
      { params: makeParams("lib-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("commit");
  });

  it("returns 404 when library not found", async () => {
    mockDb.getLibrary.mockResolvedValue(null);

    const res = await GET(
      new NextRequest("http://localhost/api/libraries/nope/skills"),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });
});

describe("GET /api/skills/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a skill by id", async () => {
    mockDb.getSkill.mockResolvedValue(MOCK_SKILL);

    const res = await GET_SKILL(
      new NextRequest("http://localhost/api/skills/skill-1"),
      { params: makeParams("skill-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("commit");
  });

  it("returns 404 when skill not found", async () => {
    mockDb.getSkill.mockResolvedValue(null);

    const res = await GET_SKILL(
      new NextRequest("http://localhost/api/skills/nope"),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/skills/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates skill description", async () => {
    mockDb.getSkill.mockResolvedValue(MOCK_SKILL);
    mockDb.updateSkill.mockResolvedValue({
      ...MOCK_SKILL,
      description: "Updated description",
    });

    const res = await PUT(
      makeReq("http://localhost/api/skills/skill-1", {
        description: "Updated description",
      }, "PUT"),
      { params: makeParams("skill-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.description).toBe("Updated description");
    expect(mockDb.updateSkill).toHaveBeenCalledWith("skill-1", {
      description: "Updated description",
    });
  });

  it("updates trigger_phrases", async () => {
    mockDb.getSkill.mockResolvedValue(MOCK_SKILL);
    mockDb.updateSkill.mockResolvedValue({
      ...MOCK_SKILL,
      trigger_phrases: ["new phrase"],
    });

    const res = await PUT(
      makeReq("http://localhost/api/skills/skill-1", {
        trigger_phrases: ["new phrase"],
      }, "PUT"),
      { params: makeParams("skill-1") }
    );

    expect(res.status).toBe(200);
  });

  it("returns 404 when skill not found", async () => {
    mockDb.getSkill.mockResolvedValue(null);

    const res = await PUT(
      makeReq("http://localhost/api/skills/nope", {
        description: "x",
      }, "PUT"),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 when no valid fields provided", async () => {
    mockDb.getSkill.mockResolvedValue(MOCK_SKILL);

    const res = await PUT(
      makeReq("http://localhost/api/skills/skill-1", {
        invalid_field: "x",
      }, "PUT"),
      { params: makeParams("skill-1") }
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when description is empty", async () => {
    mockDb.getSkill.mockResolvedValue(MOCK_SKILL);

    const res = await PUT(
      makeReq("http://localhost/api/skills/skill-1", {
        description: "  ",
      }, "PUT"),
      { params: makeParams("skill-1") }
    );

    expect(res.status).toBe(400);
  });
});
