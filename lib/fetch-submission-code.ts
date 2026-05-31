import { parseCodeFromHtml } from '@/lib/parse-submission-html';

/**
 * Client-side fallback: fetch submission page from the user's browser
 * (logged into CF) when the server is blocked by Cloudflare.
 */
export async function clientFetchSubmissionCode(
  url: string
): Promise<string | null> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) return null;
  const html = await res.text();
  return parseCodeFromHtml(html);
}
