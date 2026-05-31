import { NextRequest, NextResponse } from 'next/server';
import { fetchSubmissions, CFError } from '@/lib/codeforces';
import { getCfHandleFromRequest } from '@/lib/session';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const handle = getCfHandleFromRequest(request);
  if (!handle) {
    return NextResponse.json(
      { error: 'NOT_AUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
    const submissions = await fetchSubmissions(handle, 200);
    const serialized = submissions.map((s) => ({
      ...s,
      submittedAt: s.submittedAt.toISOString(),
    }));

    const ids = submissions.map((s) => s.id);
    let cachedIds: number[] = [];
    if (ids.length > 0) {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('diagnoses')
        .select('submission_id, analysis')
        .in('submission_id', ids);
      cachedIds =
        data
          ?.filter(
            (row) =>
              row.analysis &&
              typeof row.analysis === 'object' &&
              (row.analysis as { verdict_type?: string }).verdict_type
          )
          .map((row) => Number(row.submission_id)) ?? [];
    }

    const res = NextResponse.json({
      submissions: serialized,
      cachedSubmissionIds: cachedIds,
      fetchedAt: new Date().toISOString(),
    });
    res.headers.set('Cache-Control', 'max-age=60');
    return res;
  } catch (err) {
    if (err instanceof CFError && err.code === 'HANDLE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'HANDLE_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Submissions error:', err);
    return NextResponse.json(
      { error: 'FETCH_FAILED' },
      { status: 500 }
    );
  }
}
