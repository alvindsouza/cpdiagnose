import Groq from 'groq-sdk';
import { createServiceClient } from '@/lib/supabase';

const GROQ_MODEL = 'llama-3.1-70b-versatile';

export interface PrereqParams {
  problemTags: string[];
  conceptualGap: string;
  currentRating?: number;
  solvedProblems?: string[];
}

export interface PrereqResult {
  problemId: string;
  problemName: string;
  rating: number;
  tags: string[];
  whyThisHelps: string;
  cfUrl: string;
}

interface PrereqDbRow {
  prereq_problem_id: string;
  tag_coverage: string[] | null;
  difficulty_delta: number | null;
  prereq_name?: string | null;
  prereq_rating?: number | null;
  why_this_helps?: string | null;
  cf_url?: string | null;
}

function tagsCacheKey(tags: string[]): string {
  return `tags:${[...tags].map((t) => t.toLowerCase()).sort().join('|')}`;
}

function buildPrompt(params: PrereqParams): string {
  const rating = params.currentRating ?? 1400;
  const solved =
    params.solvedProblems?.slice(0, 20).join(', ') || 'none';

  return `You are a competitive programming curriculum designer.

A student failed a problem with these characteristics:
- Tags: ${params.problemTags.join(', ')}
- Their conceptual gap: ${params.conceptualGap}
- Current estimated rating: ${params.currentRating ?? 'unknown'}

List 3 real Codeforces problems that would build the intuition they are missing.
The problems must:
1. Be genuinely easier (at least 150 rating points below ${rating})
2. Directly teach the missing concept, not just use the same tag
3. Be well-known problems with many solvers (not obscure)
4. NOT be in this list (already solved): ${solved}

Respond ONLY in JSON array format:
[
  {
    "problemId": "455A",
    "problemName": "Boredom",
    "rating": 1500,
    "tags": ["dp"],
    "whyThisHelps": "One sentence why this builds the needed intuition",
    "cfUrl": "https://codeforces.com/contest/455/problem/A"
  }
]`;
}

function extractJsonArray(raw: string): PrereqResult[] {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    cleaned = lines.slice(1, -1).join('\n').trim();
  }

  const tryParse = (text: string): PrereqResult[] => {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array');
    }
    return parsed.map(normalizePrereqResult);
  };

  try {
    return tryParse(cleaned);
  } catch {
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']') + 1;
    if (start !== -1 && end > start) {
      return tryParse(cleaned.slice(start, end));
    }
    throw new Error(`Could not parse prereq JSON: ${cleaned.slice(0, 200)}`);
  }
}

function normalizePrereqResult(item: unknown): PrereqResult {
  const o = item as Record<string, unknown>;
  const problemId = String(o.problemId ?? '');
  const indexMatch = problemId.match(/(\d+)([A-Z]\d*)$/i);
  const cfUrl =
    String(o.cfUrl ?? '') ||
    (indexMatch
      ? `https://codeforces.com/contest/${indexMatch[1]}/problem/${indexMatch[2]}`
      : `https://codeforces.com/problemset/problem/${problemId.replace(/([A-Za-z]+)$/, '/$1')}`);

  return {
    problemId,
    problemName: String(o.problemName ?? problemId),
    rating: Number(o.rating ?? 0),
    tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
    whyThisHelps: String(o.whyThisHelps ?? ''),
    cfUrl,
  };
}

function rowToPrereqResult(row: PrereqDbRow): PrereqResult {
  const problemId = row.prereq_problem_id;
  const cfUrl =
    row.cf_url ??
    `https://codeforces.com/problemset/problem/${problemId.replace(/([A-Za-z]+)$/, '/$1')}`;

  return {
    problemId,
    problemName: row.prereq_name ?? problemId,
    rating: row.prereq_rating ?? 0,
    tags: row.tag_coverage ?? [],
    whyThisHelps:
      row.why_this_helps ??
      'Builds foundational intuition for this topic.',
    cfUrl,
  };
}

function filterSolved(
  results: PrereqResult[],
  solved?: string[]
): PrereqResult[] {
  if (!solved?.length) return results;
  const set = new Set(solved.map((id) => id.toUpperCase()));
  return results.filter((r) => !set.has(r.problemId.toUpperCase()));
}

async function fetchFromCache(
  problemTags: string[]
): Promise<PrereqResult[] | null> {
  if (problemTags.length === 0) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('problem_prerequisites')
    .select(
      'prereq_problem_id, tag_coverage, difficulty_delta, prereq_name, prereq_rating, why_this_helps, cf_url'
    )
    .overlaps('tag_coverage', problemTags)
    .order('difficulty_delta', { ascending: true })
    .limit(10);

  if (error || !data?.length) return null;

  return data.map((row) => rowToPrereqResult(row as PrereqDbRow));
}

async function callGroq(params: PrereqParams): Promise<PrereqResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('GROQ_API_KEY not set');
    return [];
  }

  const client = new Groq({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: buildPrompt(params) }],
    max_tokens: 2048,
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content ?? '';
  return extractJsonArray(content).slice(0, 3);
}

async function persistResults(
  params: PrereqParams,
  results: PrereqResult[]
): Promise<void> {
  if (results.length === 0) return;

  const supabase = createServiceClient();
  const problemId = tagsCacheKey(params.problemTags);
  const baseRating = params.currentRating ?? 1400;

  const rows = results.map((r) => ({
    problem_id: problemId,
    prereq_problem_id: r.problemId,
    tag_coverage: params.problemTags,
    difficulty_delta: Math.max(baseRating - r.rating, 0),
    prereq_name: r.problemName,
    prereq_rating: r.rating,
    why_this_helps: r.whyThisHelps,
    cf_url: r.cfUrl,
  }));

  await supabase.from('problem_prerequisites').upsert(rows, {
    onConflict: 'problem_id,prereq_problem_id',
    ignoreDuplicates: false,
  });
}

/**
 * Map problem tags + conceptual gap to prerequisite CF problems.
 * Checks Supabase cache first, then Groq (Llama 3.1 70B).
 */
export async function getPrereqProblems(
  params: PrereqParams
): Promise<PrereqResult[]> {
  try {
    if (!params.problemTags.length || !params.conceptualGap.trim()) {
      return [];
    }

    const cached = await fetchFromCache(params.problemTags);
    if (cached?.length) {
      return filterSolved(cached, params.solvedProblems).slice(0, 3);
    }

    const fromGroq = await callGroq(params);
    const filtered = filterSolved(fromGroq, params.solvedProblems).slice(0, 3);

    if (filtered.length > 0) {
      await persistResults(params, filtered).catch((err) => {
        console.warn('Failed to cache prereq problems:', err);
      });
    }

    return filtered;
  } catch (err) {
    console.error('getPrereqProblems failed:', err);
    return [];
  }
}
