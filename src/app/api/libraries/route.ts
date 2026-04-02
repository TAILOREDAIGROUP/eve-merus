import { NextRequest, NextResponse } from 'next/server';
import { createLibrary, listLibraries } from '@/lib/db';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'name is required and must be a string' },
        { status: 400 }
      );
    }

    const library = await createLibrary({
      name: body.name.trim(),
      description: body.description?.trim() || null,
      user_id: auth.user.id,
    });

    return NextResponse.json(library, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const libraries = await listLibraries(page, Math.min(limit, 100));
    return NextResponse.json(libraries);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
