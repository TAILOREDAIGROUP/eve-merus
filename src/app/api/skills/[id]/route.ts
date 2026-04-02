import { NextRequest, NextResponse } from 'next/server';
import { getSkill, updateSkill } from '@/lib/db';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const skill = await getSkill(id);

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(skill);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await getSkill(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || !body.description.trim()) {
        return NextResponse.json(
          { error: 'description must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.description = body.description.trim();
    }

    if (body.trigger_phrases !== undefined) {
      if (!Array.isArray(body.trigger_phrases)) {
        return NextResponse.json(
          { error: 'trigger_phrases must be an array' },
          { status: 400 }
        );
      }
      updates.trigger_phrases = body.trigger_phrases;
    }

    if (body.content !== undefined) {
      updates.content = body.content;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await updateSkill(id, updates);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
