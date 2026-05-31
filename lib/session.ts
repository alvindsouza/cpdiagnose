import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const CF_HANDLE_COOKIE = 'cf_handle';

export function getCfHandleFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CF_HANDLE_COOKIE)?.value ?? null;
}

export async function getCfHandleFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(CF_HANDLE_COOKIE)?.value ?? null;
}
