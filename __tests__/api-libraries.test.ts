import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing route handlers
vi.mock("@/lib/db", () => ({
  createLibrary: vi.fn(),
  listLibraries: vi.fn(),
  getLibrary: vi.fn(),
  deleteLibrary: vi.fn(),
}));

vi.mock('@/lib/auth/requireAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'user-uuid-123' } }),
}));

import { POST, GET } from "@/app/api/libraries/route";
import {
  GET as GET_BY_ID,
  DELETE,
} from "@/app/api/libraries/[id]/route";
import * as db from "@/lib/db";
import { NextRequest } from "next/server";

const mockDb = vi.mocked(db);

function makeRequest(body?: unknown, method = "POST"): NextRequest {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new NextRequest("http://localhost:3000/api/libraries", init);
}

function makeParamsPromise(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

const MOCK_LIBRARY = {
  id: "lib-123",
  name: "Test Library",
  description: "A test library",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("POST /api/libraries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a library with valid data", async () => {
    mockDb.createLibrary.mockResolvedValue(MOCK_LIBRARY);

    const res = await POST(
      makeRequest({ name: "Test Library", description: "A test library" })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("Test Library");
    expect(mockDb.createLibrary).toHaveBeenCalledWith({
      name: "Test Library",
      description: "A test library",
      user_id: 'user-uuid-123',
    });
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRequest({ description: "no name" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("name is required");
  });

  it("returns 400 when name is empty string", async () => {
    const res = await POST(makeRequest({ name: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  it("trims whitespace from name and description", async () => {
    mockDb.createLibrary.mockResolvedValue(MOCK_LIBRARY);

    await POST(
      makeRequest({ name: "  Padded Name  ", description: "  desc  " })
    );

    expect(mockDb.createLibrary).toHaveBeenCalledWith({
      name: "Padded Name",
      description: "desc",
      user_id: 'user-uuid-123',
    });
  });

  it("handles null description", async () => {
    mockDb.createLibrary.mockResolvedValue({
      ...MOCK_LIBRARY,
      description: null,
    });

    const res = await POST(makeRequest({ name: "No Desc" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(mockDb.createLibrary).toHaveBeenCalledWith({
      name: "No Desc",
      description: null,
      user_id: 'user-uuid-123',
    });
  });

  it("returns 500 on database error", async () => {
    mockDb.createLibrary.mockRejectedValue(new Error("connection failed"));

    const res = await POST(makeRequest({ name: "Fail" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("connection failed");
  });
});

describe("GET /api/libraries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns list of libraries", async () => {
    mockDb.listLibraries.mockResolvedValue([MOCK_LIBRARY]);

    const res = await GET(makeRequest(undefined, 'GET'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Test Library");
  });

  it("returns empty array when no libraries", async () => {
    mockDb.listLibraries.mockResolvedValue([]);

    const res = await GET(makeRequest(undefined, 'GET'));
    const body = await res.json();

    expect(body).toEqual([]);
  });
});

describe("GET /api/libraries/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a library by id", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);

    const req = new NextRequest("http://localhost:3000/api/libraries/lib-123");
    const res = await GET_BY_ID(req, {
      params: makeParamsPromise("lib-123"),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("lib-123");
  });

  it("returns 404 when library not found", async () => {
    mockDb.getLibrary.mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost:3000/api/libraries/nonexistent"
    );
    const res = await GET_BY_ID(req, {
      params: makeParamsPromise("nonexistent"),
    });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/libraries/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes a library", async () => {
    mockDb.getLibrary.mockResolvedValue(MOCK_LIBRARY);
    mockDb.deleteLibrary.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost:3000/api/libraries/lib-123", {
      method: "DELETE",
    });
    const res = await DELETE(req, {
      params: makeParamsPromise("lib-123"),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.deleted).toBe(true);
    expect(mockDb.deleteLibrary).toHaveBeenCalledWith("lib-123");
  });

  it("returns 404 when deleting nonexistent library", async () => {
    mockDb.getLibrary.mockResolvedValue(null);

    const req = new NextRequest(
      "http://localhost:3000/api/libraries/nonexistent",
      { method: "DELETE" }
    );
    const res = await DELETE(req, {
      params: makeParamsPromise("nonexistent"),
    });

    expect(res.status).toBe(404);
    expect(mockDb.deleteLibrary).not.toHaveBeenCalled();
  });
});
