import { NextRequest, NextResponse } from 'next/server';
import { importSkillLibrary, ImportError } from '@/lib/import';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const result = await importSkillLibrary({
      library_name: body.library_name,
      library_description: body.library_description,
      files: body.files,
      user_id: auth.user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
