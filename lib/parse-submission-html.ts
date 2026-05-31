/**
 * Extract source from CF submission page HTML (works in browser and Node).
 */
export function parseCodeFromHtml(html: string): string | null {
  const match = html.match(
    /<pre[^>]*id=["']program-source-text["'][^>]*>([\s\S]*?)<\/pre>/i
  );
  if (!match) return null;
  const raw = match[1]
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  const decoded = raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"');
  return decoded.trim() || null;
}
