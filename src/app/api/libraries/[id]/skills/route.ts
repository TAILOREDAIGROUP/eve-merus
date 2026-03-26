import { NextRequest, NextResponse } from "next/server";
import { getLibrary, bulkInsertSkills, listSkillsByLibrary } from "@/lib/db";
import type { ParsedSkill } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: libraryId } = await params;

    const library = await getLibrary(libraryId);
    if (!library) {
      return NextResponse.json(
        { error: "Library not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const skills: ParsedSkill[] = body.skills;

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { error: "skills array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each skill has required fields
    for (const skill of skills) {
      if (!skill.name || !skill.description || skill.content === undefined) {
        return NextResponse.json(
          {
            error: `Each skill must have name, description, and content. Invalid: ${skill.name || "unnamed"}`,
          },
          { status: 400 }
        );
      }
    }

    const rows = await bulkInsertSkills(
      skills.map((s) => ({
        library_id: libraryId,
        name: s.name,
        description: s.description,
        trigger_phrases: s.trigger_phrases || [],
        content: s.content,
        token_count: s.token_count || 0,
        line_count: s.line_count || 0,
        source_filename: s.source_filename || null,
      }))
    );

    return NextResponse.json(
      { imported: rows.length, skills: rows },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: libraryId } = await params;

    const library = await getLibrary(libraryId);
    if (!library) {
      return NextResponse.json(
        { error: "Library not found" },
        { status: 404 }
      );
    }

    const skills = await listSkillsByLibrary(libraryId);
    return NextResponse.json(skills);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
