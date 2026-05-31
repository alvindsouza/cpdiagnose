import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CF_HANDLE_COOKIE } from '@/lib/session';

export function middleware(request: NextRequest) {
  const handle = request.cookies.get(CF_HANDLE_COOKIE)?.value;

  if (!handle) {
    const url = new URL('/', request.url);
    url.searchParams.set('message', 'Please log in');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/analyse/:path*'],
};
