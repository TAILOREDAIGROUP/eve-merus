import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  getTestCase: vi.fn(),
  updateTestCase: vi.fn(),
  deleteTestCase: vi.fn(),
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-uuid-123' } }),
}));

import {
  GET,
  PUT,
  DELETE,
} from "@/app/api/test-cases/[id]/route";
import * as db from "@/lib/db";
import { NextRequest } from "next/server";

const mockDb = vi.mocked(db);

const MOCK_CASE = {
  id: "tc-1",
  test_set_id: "ts-1",
  request_text: "commit my changes",
  expected_skill: "commit",
  expected_supporting: [],
  should_not_trigger: ["deploy"],
  difficulty: "medium",
  cluster_tag: "git",
  created_at: "2026-01-01T00:00:00Z",
};

function makeParams(id: string) {
  return Promise.resolve({ id });
}

function makeReq(url: string, body?: unknown, method = "GET"): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(url, init);
}

describe("GET /api/test-cases/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a test case", async () => {
    mockDb.getTestCase.mockResolvedValue(MOCK_CASE);

    const res = await GET(
      makeReq("http://localhost/api/test-cases/tc-1"),
      { params: makeParams("tc-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.request_text).toBe("commit my changes");
  });

  it("returns 404 when not found", async () => {
    mockDb.getTestCase.mockResolvedValue(null);

    const res = await GET(
      makeReq("http://localhost/api/test-cases/nope"),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/test-cases/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates request_text", async () => {
    mockDb.getTestCase.mockResolvedValue(MOCK_CASE);
    mockDb.updateTestCase.mockResolvedValue({
      ...MOCK_CASE,
      request_text: "updated text",
    });

    const res = await PUT(
      makeReq("http://localhost/api/test-cases/tc-1", {
        request_text: "updated text",
      }, "PUT"),
      { params: makeParams("tc-1") }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.request_text).toBe("updated text");
  });

  it("updates difficulty", async () => {
    mockDb.getTestCase.mockResolvedValue(MOCK_CASE);
    mockDb.updateTestCase.mockResolvedValue({
      ...MOCK_CASE,
      difficulty: "hard",
    });

    const res = await PUT(
      makeReq("http://localhost/api/test-cases/tc-1", {
        difficulty: "hard",
      }, "PUT"),
      { params: makeParams("tc-1") }
    );

    expect(res.status).toBe(200);
  });

  it("rejects invalid difficulty", async () => {
    mockDb.getTestCase.mockResolvedValue(MOCK_CASE);

    const res = await PUT(
      makeReq("http://localhost/api/test-cases/tc-1", {
        difficulty: "impossible",
      }, "PUT"),
      { params: makeParams("tc-1") }
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when not found", async () => {
    mockDb.getTestCase.mockResolvedValue(null);

    const res = await PUT(
      makeReq("http://localhost/api/test-cases/nope", {
        request_text: "x",
      }, "PUT"),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 when no valid fields", async () => {
    mockDb.getTestCase.mockResolvedValue(MOCK_CASE);

    const res = await PUT(
      makeReq("http://localhost/api/test-cases/tc-1", {
        invalid: "field",
      }, "PUT"),
      { params: makeParams("tc-1") }
    );

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/test-cases/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a test case", async () => {
    mockDb.getTestCase.mockResolvedValue(MOCK_CASE);
    mockDb.deleteTestCase.mockResolvedValue(undefined);

    const res = await DELETE(
      makeReq("http://localhost/api/test-cases/tc-1", undefined, "DELETE"),
      { params: makeParams("tc-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.deleted).toBe(true);
  });

  it("returns 404 when not found", async () => {
    mockDb.getTestCase.mockResolvedValue(null);

    const res = await DELETE(
      makeReq("http://localhost/api/test-cases/nope", undefined, "DELETE"),
      { params: makeParams("nope") }
    );

    expect(res.status).toBe(404);
  });
});
