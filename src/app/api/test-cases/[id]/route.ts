import { NextRequest, NextResponse } from 'next/server';
import { getTestCase, updateTestCase, deleteTestCase } from '@/lib/db';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const tc = await getTestCase(id);

    if (!tc) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tc);
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

    const existing = await getTestCase(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.request_text !== undefined) {
      if (typeof body.request_text !== 'string' || !body.request_text.trim()) {
        return NextResponse.json(
          { error: 'request_text must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.request_text = body.request_text.trim();
    }

    if (body.expected_skill !== undefined) {
      if (
        typeof body.expected_skill !== 'string' ||
        !body.expected_skill.trim()
      ) {
        return NextResponse.json(
          { error: 'expected_skill must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.expected_skill = body.expected_skill.trim();
    }

    if (body.expected_supporting !== undefined) {
      updates.expected_supporting = body.expected_supporting;
    }
    if (body.should_not_trigger !== undefined) {
      updates.should_not_trigger = body.should_not_trigger;
    }
    if (body.difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(body.difficulty)) {
        return NextResponse.json(
          { error: 'difficulty must be easy, medium, or hard' },
          { status: 400 }
        );
      }
      updates.difficulty = body.difficulty;
    }
    if (body.cluster_tag !== undefined) {
      updates.cluster_tag = body.cluster_tag;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await updateTestCase(id, updates);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await getTestCase(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    await deleteTestCase(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
