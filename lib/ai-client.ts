import { Ollama } from 'ollama';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

const MODE = (process.env.OLLAMA_MODE || 'local').trim().toLowerCase();
const MODEL = process.env.OLLAMA_MODEL || 'codellama:7b';
const TOGETHER_CHAT_MODEL = 'meta-llama/Llama-3.1-70B-Instruct-Turbo';
const GROQ_CHAT_MODEL =
  process.env.GROQ_CHAT_MODEL || 'llama-3.1-70b-versatile';

// ── 1. Client factory ─────────────────────────────────────

function getOllamaClient(): Ollama {
  if (MODE === 'remote') {
    return new Ollama({
      host: process.env.OLLAMA_REMOTE_URL!,
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY ?? ''}`,
      },
    });
  }

  return new Ollama({
    host: process.env.OLLAMA_LOCAL_URL || 'http://localhost:11434',
  });
}

function getTogetherClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.TOGETHER_API_KEY!,
    baseURL:
      process.env.TOGETHER_BASE_URL || 'https://api.together.xyz/v1',
  });
}

// ── 2. runInference ─────────────────────────────────────────

async function runInference(prompt: string): Promise<string> {
  // Free cloud option — same Groq key as prereqs (no Together deposit needed)
  if (MODE === 'groq') {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await client.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.1,
    });
    return response.choices[0]?.message?.content ?? '';
  }

  if (MODE === 'together') {
    const client = getTogetherClient();
    const response = await client.chat.completions.create({
      model: TOGETHER_CHAT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.1,
    });
    return response.choices[0]?.message?.content ?? '';
  }

  const client = getOllamaClient();
  const response = await client.chat({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    options: {
      temperature: 0.1,
      num_predict: 2048,
    },
  });
  return response.message.content;
}

// ── 3. extractJSON ──────────────────────────────────────────

function extractJSON(raw: string): object {
  let cleaned = raw.trim();

  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    cleaned = lines.slice(1, -1).join('\n').trim();
  }

  try {
    return JSON.parse(cleaned) as object;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}') + 1;
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end)) as object;
      } catch {
        // fall through
      }
    }
    throw new Error(
      `Could not extract JSON from model response: ${cleaned.slice(0, 200)}`
    );
  }
}

// ── Types ───────────────────────────────────────────────────

export interface AnalyseParams {
  problemName: string;
  problemRating?: number;
  problemTags: string[];
  problemStatement: string;
  code: string;
  language: string;
  verdict: 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'OK';
  passedTestCount: number;
}

export interface AnalysisError {
  id: string;
  line_start: number;
  line_end: number;
  col_start: number;
  col_end: number;
  type: 'logic_error' | 'efficiency' | 'edge_case' | 'algorithm';
  severity: 'critical' | 'warning' | 'suggestion';
  short_description: string;
  full_explanation: string;
  correct_intuition: string;
  visual_hint?: string | null;
}

export interface AnalysisResult {
  verdict_type: 'wrong_answer' | 'time_limit' | 'runtime_error' | 'accepted';
  one_line_summary: string;
  errors: AnalysisError[];
  correct_pattern: string;
  conceptual_gap: string;
  prereq_topics: string[];
  efficiency_note?: string | null;
}

// ── Prompt builder (exact template) ─────────────────────────

function buildAnalysisPrompt(params: AnalyseParams): string {
  return `You are an expert competitive programming coach. You are reviewing a student's
submission. Your job is to identify EXACTLY what is wrong with their thinking,
NOT to give them the answer.

PROBLEM: ${params.problemName}
Rating: ${params.problemRating ?? 'unknown'}
Tags: ${params.problemTags.join(', ')}
Verdict: ${params.verdict} (passed ${params.passedTestCount} tests)

PROBLEM STATEMENT:
${params.problemStatement}

STUDENT'S CODE (${params.language}):
${params.code}

ANALYSIS RULES:
1. Identify each specific flaw in the code with exact line numbers.
2. For each flaw: explain WHY the logic fails, not how to fix it.
3. DO NOT write corrected code. DO NOT hint at specific variable names or structure.
4. The correct_intuition must be a mental model explanation, not code.
5. visual_hint must be a short ASCII/text diagram if it helps (max 8 lines), or null.
6. prereq_topics: list 2-3 Codeforces problem tag strings the student needs to master.
7. If verdict is OK, look for efficiency issues (unnecessary loops, wrong complexity).
8. Be specific about lines. If an error spans lines 5-12, say so.

Respond ONLY in this JSON format, no preamble, no markdown fences:

{
  "verdict_type": "wrong_answer|time_limit|runtime_error|accepted",
  "one_line_summary": "...",
  "errors": [
    {
      "id": "err_1",
      "line_start": 5,
      "line_end": 8,
      "col_start": 0,
      "col_end": 40,
      "type": "logic_error|efficiency|edge_case|algorithm",
      "severity": "critical|warning|suggestion",
      "short_description": "under 15 words shown on hover",
      "full_explanation": "2-4 sentences explaining WHY this fails, not how to fix",
      "correct_intuition": "The mental model they need to build...",
      "visual_hint": "optional ASCII diagram or null"
    }
  ],
  "correct_pattern": "Name of the correct algorithm/pattern",
  "conceptual_gap": "The root mental model the student lacks",
  "prereq_topics": ["dp", "greedy"],
  "efficiency_note": "Only if verdict is OK — note inefficiency or null"
}`;
}

function buildRetryPrompt(params: AnalyseParams): string {
  return `Analyse this code briefly. Problem: ${params.problemName}. Tags: ${params.problemTags.join(', ')}.
Verdict: ${params.verdict}. Code: ${params.code.slice(0, 1000)}.
Return JSON only: {verdict_type, one_line_summary, errors:[], correct_pattern,
conceptual_gap, prereq_topics:[], efficiency_note:null}`;
}

// ── 4. analyseSubmission ────────────────────────────────────

export async function analyseSubmission(
  params: AnalyseParams
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(params);
  const raw = await runInference(prompt);

  try {
    return extractJSON(raw) as AnalysisResult;
  } catch {
    try {
      const retryRaw = await runInference(buildRetryPrompt(params));
      return extractJSON(retryRaw) as AnalysisResult;
    } catch {
      throw new Error('AI analysis failed after retry');
    }
  }
}

// ── 5. checkOllamaHealth ────────────────────────────────────

export async function checkOllamaHealth(): Promise<{
  ok: boolean;
  model: string;
  mode: string;
}> {
  try {
    if (MODE === 'groq') {
      return {
        ok: !!process.env.GROQ_API_KEY,
        model: GROQ_CHAT_MODEL,
        mode: 'groq',
      };
    }

    if (MODE === 'together') {
      return {
        ok: !!process.env.TOGETHER_API_KEY,
        model: 'llama-3.1-70b',
        mode: 'together',
      };
    }

    const client = getOllamaClient();
    const models = await client.list();
    const baseName = MODEL.split(':')[0];
    const hasModel = models.models.some((m) => m.name.startsWith(baseName));
    return { ok: hasModel, model: MODEL, mode: MODE };
  } catch {
    return { ok: false, model: MODEL, mode: MODE };
  }
}
