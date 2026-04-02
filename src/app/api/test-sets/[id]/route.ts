import { NextRequest, NextResponse } from 'next/server';
import { getTestSet, deleteTestSet } from '@/lib/db';
import { requireAuth } from '@/lib/auth/requireAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const testSet = await getTestSet(id);

    if (!testSet) {
      return NextResponse.json(
        { error: 'Test set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testSet);
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

    const testSet = await getTestSet(id);
    if (!testSet) {
      return NextResponse.json(
        { error: 'Test set not found' },
        { status: 404 }
      );
    }

    await deleteTestSet(id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
