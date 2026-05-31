import { NextRequest, NextResponse } from 'next/server';
import {
  fetchSubmissionCode,
  submissionPageUrl,
} from '@/lib/codeforces';
import { createServiceClient, decryptCookieIfNeeded } from '@/lib/supabase';
import { getCfHandleFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const handle = getCfHandleFromRequest(request);
  if (!handle) {
    return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 });
  }

  const contestId = Number(request.nextUrl.searchParams.get('contestId'));
  const submissionId = Number(
    request.nextUrl.searchParams.get('submissionId')
  );
  const language =
    request.nextUrl.searchParams.get('language') ?? 'GNU G++17';

  if (!contestId || !submissionId) {
    return NextResponse.json(
      { error: 'MISSING_PARAMS' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServiceClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('cf_handle', handle)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({
        requiresClientFetch: true,
        url: submissionPageUrl(contestId, submissionId),
      });
    }

    const { data: cfSession } = await supabase
      .from('cf_sessions')
      .select('session_cookie')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cfSession?.session_cookie) {
      return NextResponse.json({
        requiresClientFetch: true,
        url: submissionPageUrl(contestId, submissionId),
      });
    }

    const code = await fetchSubmissionCode(
      contestId,
      submissionId,
      decryptCookieIfNeeded(cfSession.session_cookie)
    );

    if (!code) {
      return NextResponse.json({
        requiresClientFetch: true,
        url: submissionPageUrl(contestId, submissionId),
      });
    }

    return NextResponse.json({ code, language });
  } catch {
    return NextResponse.json({
      requiresClientFetch: true,
      url: submissionPageUrl(contestId, submissionId),
    });
  }
}
