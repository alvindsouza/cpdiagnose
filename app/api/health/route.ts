import { checkOllamaHealth } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await checkOllamaHealth();
  return Response.json(health, { status: health.ok ? 200 : 503 });
}
