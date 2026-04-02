import { NextRequest, NextResponse } from 'next/server';
import {
  getTestSet,
  listTestCases,
  bulkInsertTestCases,
} from '@/lib/db';
import { validateTestCaseBatch } from '@/lib/test-cases';
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

    const cases = await listTestCases(id);
    return NextResponse.json(cases);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const cases = body.test_cases || body;

    if (!Array.isArray(cases) || cases.length === 0) {
      return NextResponse.json(
        { error: 'test_cases array is required and must not be empty' },
        { status: 400 }
      );
    }

    const validation = validateTestCaseBatch(cases);

    if (validation.valid.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid test cases found',
          validation_errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const inserted = await bulkInsertTestCases(
      validation.valid.map((tc) => ({
        test_set_id: id,
        request_text: tc.request_text,
        expected_skill: tc.expected_skill,
        expected_supporting: tc.expected_supporting || [],
        should_not_trigger: tc.should_not_trigger || [],
        difficulty: tc.difficulty || 'medium',
        cluster_tag: tc.cluster_tag || null,
      }))
    );

    return NextResponse.json(
      {
        imported: inserted.length,
        cases: inserted,
        validation_errors: validation.errors,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
