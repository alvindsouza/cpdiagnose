import { NextRequest, NextResponse } from 'next/server';
import { loginToCF, verifyHandle } from '@/lib/codeforces';
import { createServiceClient, encryptCookie } from '@/lib/supabase';
import { CF_HANDLE_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const handle = String(body.handle ?? '').trim();
    const password = String(body.password ?? '');

    if (!handle || !password) {
      return NextResponse.json(
        {
          error: 'MISSING_FIELDS',
          message: 'Handle and password required',
        },
        { status: 400 }
      );
    }

    const exists = await verifyHandle(handle);
    if (!exists) {
      return NextResponse.json(
        {
          error: 'HANDLE_NOT_FOUND',
          message:
            'This Codeforces handle does not exist. Check your spelling.',
        },
        { status: 404 }
      );
    }

    const login = await loginToCF(handle, password);

    if (login.error === 'INVALID_CREDENTIALS') {
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Wrong password' },
        { status: 401 }
      );
    }
    if (login.error === 'RATE_LIMITED') {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many attempts. Try again in 5 minutes.',
        },
        { status: 429 }
      );
    }
    if (login.error === 'NETWORK_ERROR' || !login.success || !login.sessionCookie) {
      return NextResponse.json(
        {
          error: 'NETWORK_ERROR',
          message: 'Could not reach Codeforces. Try again.',
        },
        { status: 503 }
      );
    }

    const supabase = createServiceClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({ cf_handle: handle }, { onConflict: 'cf_handle' })
      .select('id')
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Database error' },
        { status: 500 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await supabase.from('cf_sessions').upsert(
      {
        user_id: user.id,
        session_cookie: encryptCookie(login.sessionCookie),
        jsessionid: login.jsessionid ?? null,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    const response = NextResponse.json({ success: true, handle });
    response.cookies.set(CF_HANDLE_COOKIE, handle, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json(
      { error: 'UNKNOWN', message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
