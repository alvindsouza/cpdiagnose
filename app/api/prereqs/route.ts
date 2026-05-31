import { NextRequest, NextResponse } from 'next/server';
import { getPrereqProblems } from '@/lib/prereqs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const topics = request.nextUrl.searchParams.get('topics');
  const conceptualGap =
    request.nextUrl.searchParams.get('conceptualGap') ?? '';
  const maxRating = request.nextUrl.searchParams.get('maxRating');

  if (!topics) {
    return NextResponse.json({ problems: [] });
  }

  const problems = await getPrereqProblems({
    problemTags: topics.split(',').map((t) => t.trim()).filter(Boolean),
    conceptualGap,
    currentRating: maxRating ? Number(maxRating) : undefined,
  });

  return NextResponse.json({ problems });
}
