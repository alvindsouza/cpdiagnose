import { NextRequest, NextResponse } from 'next/server';
import { analyseSubmission, type AnalyseParams } from '@/lib/ai-client';
import { createServiceClient } from '@/lib/supabase';
import { getCfHandleFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';

function normalizeVerdict(v: string): AnalyseParams['verdict'] {
  if (v === 'OK') return 'OK';
  if (v === 'TIME_LIMIT_EXCEEDED') return 'TIME_LIMIT_EXCEEDED';
  if (v === 'RUNTIME_ERROR') return 'RUNTIME_ERROR';
  return 'WRONG_ANSWER';
}

export async function POST(request: NextRequest) {
  const handle = getCfHandleFromRequest(request);
  const body = await request.json();
  const submissionId = Number(body.submissionId);

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('diagnoses')
    .select('analysis')
    .eq('submission_id', submissionId)
    .maybeSingle();

  const stored = existing?.analysis as Record<string, unknown> | null;
  if (stored?.verdict_type && !stored.cached_code) {
    console.log('Serving cached analysis for submission', submissionId);
    return NextResponse.json({ ...stored, cached: true });
  }

  const params: AnalyseParams = {
    problemName: String(body.problemName ?? ''),
    problemRating: body.problemRating ? Number(body.problemRating) : undefined,
    problemTags: Array.isArray(body.problemTags) ? body.problemTags : [],
    problemStatement: String(body.problemStatement ?? ''),
    code: String(body.code ?? ''),
    language: String(body.language ?? ''),
    verdict: normalizeVerdict(String(body.verdict ?? 'WRONG_ANSWER')),
    passedTestCount: Number(body.passedTestCount ?? 0),
  };

  if (!params.code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  try {
    const analysis = await analyseSubmission(params);

    await supabase.from('diagnoses').upsert(
      {
        submission_id: submissionId,
        cf_handle: handle ?? 'anonymous',
        problem_name: params.problemName,
        problem_rating: params.problemRating ?? null,
        problem_tags: params.problemTags,
        analysis: analysis as unknown as Record<string, unknown>,
      },
      { onConflict: 'submission_id' }
    );

    return NextResponse.json({ ...analysis, cached: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'AI_UNAVAILABLE',
          message: 'AI service is not running. Start Ollama with: ollama serve',
        },
        { status: 503 }
      );
    }
    if (msg.includes('AI analysis failed after retry')) {
      return NextResponse.json(
        {
          error: 'ANALYSIS_FAILED',
          message: 'Could not analyse this submission. Try again.',
        },
        { status: 500 }
      );
    }
    console.error('Analyse error:', err);
    return NextResponse.json(
      {
        error: 'ANALYSIS_FAILED',
        message: 'Could not analyse this submission. Try again.',
      },
      { status: 500 }
    );
  }
}
