import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

vi.mock("@/lib/db", () => ({
  createTestSet: vi.fn(),
  listTestSets: vi.fn(),
  getTestSet: vi.fn(),
  deleteTestSet: vi.fn(),
  getLibrary: vi.fn(),
  bulkInsertTestCases: vi.fn(),
  listTestCases: vi.fn(),
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-uuid-123' } }),
}));

import { POST, GET } from "@/app/api/test-sets/route";
import {
  GET as GET_BY_ID,
  DELETE,
} from "@/app/api/test-sets/[id]/route";
import {
  GET as GET_CASES,
  POST as POST_CASES,
} from "@/app/api/test-sets/[id]/cases/route";
import { GET as EXPORT } from "@/app/api/test-sets/[id]/export/route";
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

const MOCK_TEST_SET = {
  id: "ts-1",
  library_id: "lib-1",
  name: "Golden Test v1",
  description: "Main routing test",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const MOCK_CASE = {
  id: "tc-1",
  test_set_id: "ts-1",
  request_text: "commit my changes",
  expected_skill: "commit",
  expected_supporting: [],
  should_not_trigger: ["deploy"],
  difficulty: "easy",
  cluster_tag: "git",
  created_at: "2026-01-01T00:00:00Z",
};

function makeParams(id: string) {
  return Promise.resolve({ id });
}

function makeReq(
  url: string,
  body?: unknown,
  method = "GET"
): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(url, init);
}

// Load fixture
const goldenTestSet = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "fixtures/golden-test-set.json"),
    "utf-8"
  )
);

describe("POST /api/test-sets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a test set with inline cases", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.createTestSet.mockResolvedValue(MOCK_TEST_SET);
    mockDb.bulkInsertTestCases.mockImplementation(async (cases) =>
      cases.map((c, i) => ({ id: `tc-${i}`, ...c, created_at: "2026-01-01T00:00:00Z" }))
    );

    const res = await POST(
      makeReq("http://localhost/api/test-sets", {
        library_id: "lib-1",
        name: "Golden Test v1",
        description: "Main routing test",
        test_cases: goldenTestSet.test_cases,
      }, "POST")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.test_set.name).toBe("Golden Test v1");
    expect(body.imported_cases).toBe(10);
    expect(body.validation_errors).toHaveLength(0);
  });

  it("creates a test set without cases", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.createTestSet.mockResolvedValue(MOCK_TEST_SET);

    const res = await POST(
      makeReq("http://localhost/api/test-sets", {
        library_id: "lib-1",
        name: "Empty Set",
      }, "POST")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.imported_cases).toBe(0);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(
      makeReq("http://localhost/api/test-sets", {
        library_id: "lib-1",
      }, "POST")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when library not found", async () => {
    mockDb.getLibrary.mockResolvedValue(null);

    const res = await POST(
      makeReq("http://localhost/api/test-sets", {
        library_id: "nope",
        name: "Test",
      }, "POST")
    );
    expect(res.status).toBe(404);
  });

  it("reports validation errors for bad cases while importing valid ones", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.createTestSet.mockResolvedValue(MOCK_TEST_SET);
    mockDb.bulkInsertTestCases.mockImplementation(async (cases) =>
      cases.map((c, i) => ({ id: `tc-${i}`, ...c, created_at: "2026-01-01T00:00:00Z" }))
    );

    const res = await POST(
      makeReq("http://localhost/api/test-sets", {
        library_id: "lib-1",
        name: "Mixed",
        test_cases: [
          { request_text: "valid", expected_skill: "skill" },
          { bad: "data" },
        ],
      }, "POST")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.imported_cases).toBe(1);
    expect(body.validation_errors).toHaveLength(1);
  });
});

describe("GET /api/test-sets", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists all test sets", async () => {
    mockDb.listTestSets.mockResolvedValue([MOCK_TEST_SET]);

    const res = await GET(
      new NextRequest("http://localhost/api/test-sets")
    );
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(mockDb.listTestSets).toHaveBeenCalledWith(undefined);
  });

  it("filters by library_id", async () => {
    mockDb.listTestSets.mockResolvedValue([MOCK_TEST_SET]);

    const res = await GET(
      new NextRequest("http://localhost/api/test-sets?library_id=lib-1")
    );

    expect(mockDb.listTestSets).toHaveBeenCalledWith("lib-1");
  });
});

describe("GET /api/test-sets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a test set by id", async () => {
    mockDb.getTestSet.mockResolvedValue(MOCK_TEST_SET);

    const res = await GET_BY_ID(
      new NextRequest("http://localhost/api/test-sets/ts-1"),
      { params: makeParams("ts-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe("Golden Test v1");
  });

  it("returns 404", async () => {
    mockDb.getTestSet.mockResolvedValue(null);

    const res = await GET_BY_ID(
      new NextRequest("http://localhost/api/test-sets/nope"),
      { params: makeParams("nope") }
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/test-sets/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a test set", async () => {
    mockDb.getTestSet.mockResolvedValue(MOCK_TEST_SET);
    mockDb.deleteTestSet.mockResolvedValue(undefined);

    const res = await DELETE(
      makeReq("http://localhost/api/test-sets/ts-1", undefined, "DELETE"),
      { params: makeParams("ts-1") }
    );

    expect(res.status).toBe(200);
  });
});

describe("GET /api/test-sets/[id]/cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns test cases for a set", async () => {
    mockDb.getTestSet.mockResolvedValue(MOCK_TEST_SET);
    mockDb.listTestCases.mockResolvedValue([MOCK_CASE]);

    const res = await GET_CASES(
      new NextRequest("http://localhost/api/test-sets/ts-1/cases"),
      { params: makeParams("ts-1") }
    );
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].request_text).toBe("commit my changes");
  });

  it("returns 404 when set not found", async () => {
    mockDb.getTestSet.mockResolvedValue(null);

    const res = await GET_CASES(
      new NextRequest("http://localhost/api/test-sets/nope/cases"),
      { params: makeParams("nope") }
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/test-sets/[id]/cases", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds cases to an existing set", async () => {
    mockDb.getTestSet.mockResolvedValue(MOCK_TEST_SET);
    mockDb.bulkInsertTestCases.mockImplementation(async (cases) =>
      cases.map((c, i) => ({ id: `tc-${i}`, ...c, created_at: "2026-01-01T00:00:00Z" }))
    );

    const res = await POST_CASES(
      makeReq("http://localhost/api/test-sets/ts-1/cases", {
        test_cases: [
          { request_text: "new test", expected_skill: "debug" },
        ],
      }, "POST"),
      { params: makeParams("ts-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.imported).toBe(1);
  });

  it("returns 400 when all cases invalid", async () => {
    mockDb.getTestSet.mockResolvedValue(MOCK_TEST_SET);

    const res = await POST_CASES(
      makeReq("http://localhost/api/test-sets/ts-1/cases", {
        test_cases: [{ bad: "data" }],
      }, "POST"),
      { params: makeParams("ts-1") }
    );

    expect(res.status).toBe(400);
  });
});

describe("GET /api/test-sets/[id]/export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exports test set as JSON with download header", async () => {
    mockDb.getTestSet.mockResolvedValue(MOCK_TEST_SET);
    mockDb.listTestCases.mockResolvedValue([MOCK_CASE]);

    const res = await EXPORT(
      new NextRequest("http://localhost/api/test-sets/ts-1/export"),
      { params: makeParams("ts-1") }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");

    const body = JSON.parse(await res.text());
    expect(body.name).toBe("Golden Test v1");
    expect(body.test_cases).toHaveLength(1);
    expect(body.exported_at).toBeDefined();
    // Export should strip internal IDs
    expect(body.test_cases[0].id).toBeUndefined();
    expect(body.test_cases[0].test_set_id).toBeUndefined();
  });

  it("returns 404 when set not found", async () => {
    mockDb.getTestSet.mockResolvedValue(null);

    const res = await EXPORT(
      new NextRequest("http://localhost/api/test-sets/nope/export"),
      { params: makeParams("nope") }
    );
    expect(res.status).toBe(404);
  });
});

describe("Golden test set fixture", () => {
  it("has 10 test cases", () => {
    expect(goldenTestSet.test_cases).toHaveLength(10);
  });

  it("covers all 7 skills", () => {
    const skills = new Set(
      goldenTestSet.test_cases.map(
        (tc: { expected_skill: string }) => tc.expected_skill
      )
    );
    expect(skills.size).toBe(7);
    expect(skills).toContain("commit");
    expect(skills).toContain("review-pr");
    expect(skills).toContain("debug");
    expect(skills).toContain("refactor");
    expect(skills).toContain("test-writer");
    expect(skills).toContain("explain");
    expect(skills).toContain("deploy");
  });

  it("has varied difficulty levels", () => {
    const difficulties = new Set(
      goldenTestSet.test_cases.map(
        (tc: { difficulty: string }) => tc.difficulty
      )
    );
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });
});
