import { describe, it, expect } from "vitest";
import { DatabaseError } from "@/lib/db";

describe("DatabaseError", () => {
  it("includes operation name in message", () => {
    const err = new DatabaseError("createLibrary", "duplicate key");
    expect(err.message).toContain("createLibrary");
    expect(err.message).toContain("duplicate key");
    expect(err.operation).toBe("createLibrary");
    expect(err.name).toBe("DatabaseError");
  });

  it("is an instance of Error", () => {
    const err = new DatabaseError("test", "msg");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DatabaseError);
  });
});
