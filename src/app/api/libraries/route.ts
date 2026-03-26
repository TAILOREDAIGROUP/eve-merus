import { NextRequest, NextResponse } from "next/server";
import { createLibrary, listLibraries } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "name is required and must be a string" },
        { status: 400 }
      );
    }

    const library = await createLibrary({
      name: body.name.trim(),
      description: body.description?.trim() || null,
    });

    return NextResponse.json(library, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const libraries = await listLibraries();
    return NextResponse.json(libraries);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
