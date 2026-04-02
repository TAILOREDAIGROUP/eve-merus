import { NextRequest, NextResponse } from 'next/server';
import { getTestSet, listTestCases } from '@/lib/db';
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

    const exportData = {
      name: testSet.name,
      description: testSet.description,
      library_id: testSet.library_id,
      exported_at: new Date().toISOString(),
      test_cases: cases.map((tc) => ({
        request_text: tc.request_text,
        expected_skill: tc.expected_skill,
        expected_supporting: tc.expected_supporting,
        should_not_trigger: tc.should_not_trigger,
        difficulty: tc.difficulty,
        cluster_tag: tc.cluster_tag,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${testSet.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
