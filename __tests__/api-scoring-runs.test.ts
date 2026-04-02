import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

function chainMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock scorer to control output
vi.mock("@/lib/scorer", () => ({
  scoreTestSet: vi.fn(),
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-uuid-123' } }),
}));

import { POST, GET } from "@/app/api/scoring-runs/route";
import { GET as GET_BY_ID } from "@/app/api/scoring-runs/[id]/route";
import * as supabaseModule from "@/lib/supabase";
import * as scorerModule from "@/lib/scorer";
import { NextRequest } from "next/server";

const mockGetClient = vi.mocked(supabaseModule.getSupabaseClient);
const mockScorer = vi.mocked(scorerModule.scoreTestSet);

function makeReq(url: string, body?: unknown, method = "GET"): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest(url, init);
}

function makeParams(id: string) {
  return Promise.resolve({ id });
}

describe("POST /api/scoring-runs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when library_id missing", async () => {
    const res = await POST(
      makeReq("http://localhost/api/scoring-runs", {
        test_set_id: "ts-1",
      }, "POST")
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when test_set_id missing", async () => {
    const res = await POST(
      makeReq("http://localhost/api/scoring-runs", {
        library_id: "lib-1",
      }, "POST")
    );
    expect(res.status).toBe(400);
  });

  it("runs scoring and returns 201 on success", async () => {
    // Setup mock chains for skills query
    const skillsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { name: "commit", description: "Git commit", trigger_phrases: ["commit"] },
        ],
        error: null,
      }),
    };

    // Cases query
    const casesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { id: "tc-1", request_text: "commit changes", expected_skill: "commit", should_not_trigger: [] },
        ],
        error: null,
      }),
    };

    // Insert scoring run
    const insertRunChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "run-1", accuracy: 1.0 },
        error: null,
      }),
    };

    // Insert results
    const insertResultsChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    let callCount = 0;
    mockGetClient.mockReturnValue({
      from: vi.fn((table: string) => {
        callCount++;
        if (table === "skills") return skillsChain;
        if (table === "test_cases") return casesChain;
        if (table === "scoring_runs") return insertRunChain;
        if (table === "scoring_results") return insertResultsChain;
        return skillsChain;
      }),
    } as any);

    mockScorer.mockReturnValue({
      accuracy: 1.0,
      collision_rate: 0,
      total_cases: 1,
      correct_count: 1,
      collision_count: 0,
      wrong_count: 0,
      miss_count: 0,
      case_results: [
        {
          request_text: "commit changes",
          expected_skill: "commit",
          result_type: "correct",
          triggered_skill: "commit",
          all_triggered: ["commit"],
          confidence: 0.95,
          match_details: [],
        },
      ],
    });

    const res = await POST(
      makeReq("http://localhost/api/scoring-runs", {
        library_id: "lib-1",
        test_set_id: "ts-1",
      }, "POST")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.summary.accuracy).toBe(1.0);
    expect(body.summary.correct_count).toBe(1);
    expect(mockScorer).toHaveBeenCalled();
  });

  it("returns 400 when library has no skills", async () => {
    mockGetClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    } as any);

    const res = await POST(
      makeReq("http://localhost/api/scoring-runs", {
        library_id: "lib-empty",
        test_set_id: "ts-1",
      }, "POST")
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("no skills");
  });
});

describe("GET /api/scoring-runs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists scoring runs", async () => {
    mockGetClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: "run-1", accuracy: 0.9 }],
          error: null,
        }),
      })),
    } as any);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
  });
});

describe("GET /api/scoring-runs/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns run with results", async () => {
    const runChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "run-1", accuracy: 0.9, total_cases: 10 },
        error: null,
      }),
    };

    const resultsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "sr-1",
            test_case_id: "tc-1",
            triggered_skill: "commit",
            result_type: "correct",
            test_cases: { request_text: "commit", expected_skill: "commit" },
          },
        ],
        error: null,
      }),
    };

    let callCount = 0;
    mockGetClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "scoring_runs") return runChain;
        return resultsChain;
      }),
    } as any);

    const res = await GET_BY_ID(
      new NextRequest("http://localhost/api/scoring-runs/run-1"),
      { params: makeParams("run-1") }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.run.id).toBe("run-1");
    expect(body.results).toHaveLength(1);
    expect(body.results[0].result_type).toBe("correct");
  });

  it("returns 404 when not found", async () => {
    mockGetClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "not found" },
        }),
      })),
    } as any);

    const res = await GET_BY_ID(
      new NextRequest("http://localhost/api/scoring-runs/nope"),
      { params: makeParams("nope") }
    );
    expect(res.status).toBe(404);
  });
});
