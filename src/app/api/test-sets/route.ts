import { NextRequest, NextResponse } from "next/server";
import {
  createTestSet,
  listTestSets,
  getLibrary,
  bulkInsertTestCases,
} from "@/lib/db";
import { validateTestCaseBatch } from "@/lib/test-cases";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!body.library_id || typeof body.library_id !== "string") {
      return NextResponse.json(
        { error: "library_id is required" },
        { status: 400 }
      );
    }

    const library = await getLibrary(body.library_id);
    if (!library) {
      return NextResponse.json(
        { error: "Library not found" },
        { status: 404 }
      );
    }

    const testSet = await createTestSet({
      library_id: body.library_id,
      name: body.name.trim(),
      description: body.description?.trim() || null,
    });

    // If test_cases are provided inline, import them
    let importedCases: unknown[] = [];
    let validationErrors: { index: number; errors: string[] }[] = [];

    if (body.test_cases && Array.isArray(body.test_cases)) {
      const validation = validateTestCaseBatch(body.test_cases);
      validationErrors = validation.errors;

      if (validation.valid.length > 0) {
        importedCases = await bulkInsertTestCases(
          validation.valid.map((tc) => ({
            test_set_id: testSet.id,
            request_text: tc.request_text,
            expected_skill: tc.expected_skill,
            expected_supporting: tc.expected_supporting || [],
            should_not_trigger: tc.should_not_trigger || [],
            difficulty: tc.difficulty || "medium",
            cluster_tag: tc.cluster_tag || null,
          }))
        );
      }
    }

    return NextResponse.json(
      {
        test_set: testSet,
        imported_cases: importedCases.length,
        validation_errors: validationErrors,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const libraryId =
      request.nextUrl.searchParams.get("library_id") || undefined;
    const testSets = await listTestSets(libraryId);
    return NextResponse.json(testSets);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
