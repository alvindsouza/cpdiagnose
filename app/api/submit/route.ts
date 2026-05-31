import { NextRequest, NextResponse } from 'next/server';
import { submitSolution } from '@/lib/cf-submit';
import { createServiceClient, decryptCookieIfNeeded } from '@/lib/supabase';
import { getCfHandleFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const handle = getCfHandleFromRequest(request);
  if (!handle) {
    return NextResponse.json(
      { success: false, error: 'NOT_AUTHENTICATED' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const contestId = Number(body.contestId);
  const problemIndex = String(body.problemIndex ?? '');
  const languageName = String(body.language ?? 'GNU G++17');
  const code = String(body.code ?? '');

  if (!contestId || !problemIndex || !code) {
    return NextResponse.json(
      { success: false, error: 'MISSING_FIELDS' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('cf_handle', handle)
    .maybeSingle();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'NO_SESSION' },
      { status: 401 }
    );
  }

  const { data: cfSession } = await supabase
    .from('cf_sessions')
    .select('session_cookie, jsessionid')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!cfSession?.session_cookie) {
    return NextResponse.json(
      { success: false, error: 'NO_SESSION' },
      { status: 401 }
    );
  }

  const result = await submitSolution({
    contestId,
    problemIndex,
    languageName,
    code,
    sessionCookie: decryptCookieIfNeeded(cfSession.session_cookie),
    jsessionid: cfSession.jsessionid ?? undefined,
  });

  if (result.error === 'cloudflare_blocked') {
    return NextResponse.json({
      success: false,
      error: 'CF_BLOCKED',
      message: result.message,
      problemUrl: `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`,
    });
  }

  return NextResponse.json(result);
}
