import { NextRequest, NextResponse } from "next/server";
import { importSkillLibrary, ImportError } from "@/lib/import";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await importSkillLibrary({
      library_name: body.library_name,
      library_description: body.library_description,
      files: body.files,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
