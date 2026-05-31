import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

export class CFError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CFError';
  }
}

export interface CFSubmission {
  id: number;
  contestId: number;
  problemIndex: string;
  problemName: string;
  tags: string[];
  rating?: number;
  verdict:
    | 'OK'
    | 'WRONG_ANSWER'
    | 'TIME_LIMIT_EXCEEDED'
    | 'RUNTIME_ERROR'
    | 'COMPILATION_ERROR'
    | 'MEMORY_LIMIT_EXCEEDED'
    | string;
  language: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
  submittedAt: Date;
}

export interface CFLoginResult {
  success: boolean;
  sessionCookie?: string;
  jsessionid?: string;
  error?: 'INVALID_CREDENTIALS' | 'HANDLE_NOT_FOUND' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  errorMessage?: string;
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

interface CFApiSubmission {
  id: number;
  contestId: number;
  problem: {
    index: string;
    name: string;
    tags?: string[];
    rating?: number;
  };
  verdict?: string;
  programmingLanguage: string;
  passedTestCount?: number;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
  creationTimeSeconds: number;
}

interface CFStatusResponse {
  status: string;
  comment?: string;
  result: CFApiSubmission[];
}

interface CFUserInfoResponse {
  status: string;
  comment?: string;
}

function parseCsrfToken(html: string): string | null {
  const $ = cheerio.load(html);
  return (
    $('meta[name="X-Csrf-Token"]').attr('content') ??
    $('input[name="csrf_token"]').attr('value') ??
    null
  );
}

function extractCookiesFromResponse(response: AxiosResponse): {
  sessionCookie: string;
  jsessionid: string;
} {
  const parts: string[] = [];
  let jsessionid = '';
  const setCookies = response.headers['set-cookie'];
  if (Array.isArray(setCookies)) {
    for (const raw of setCookies) {
      const pair = raw.split(';')[0];
      parts.push(pair);
      if (pair.startsWith('JSESSIONID=')) {
        jsessionid = pair.split('=')[1] ?? '';
      }
    }
  }
  return { sessionCookie: parts.join('; '), jsessionid };
}

/** Public API — recent submissions */
export async function fetchSubmissions(
  handle: string,
  count: number
): Promise<CFSubmission[]> {
  const url = `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`;

  const { data } = await axios.get<CFStatusResponse>(url, { timeout: 20000 });

  if (data.status !== 'OK') {
    const comment = data.comment ?? '';
    if (comment.toLowerCase().includes('not found')) {
      throw new CFError('HANDLE_NOT_FOUND', 'Codeforces handle does not exist');
    }
    throw new CFError('API_ERROR', comment || 'Codeforces API error');
  }

  return data.result
    .filter((s) => s.contestId <= 100000)
    .map((s) => ({
      id: s.id,
      contestId: s.contestId,
      problemIndex: s.problem.index,
      problemName: s.problem.name,
      tags: s.problem.tags ?? [],
      rating: s.problem.rating,
      verdict: s.verdict ?? 'UNKNOWN',
      language: s.programmingLanguage,
      passedTestCount: s.passedTestCount ?? 0,
      timeConsumedMillis: s.timeConsumedMillis ?? 0,
      memoryConsumedBytes: s.memoryConsumedBytes ?? 0,
      submittedAt: new Date(s.creationTimeSeconds * 1000),
    }));
}

/** Check handle exists before password login */
export async function verifyHandle(handle: string): Promise<boolean> {
  try {
    const { data } = await axios.get<CFUserInfoResponse>(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      { timeout: 15000 }
    );
    return data.status === 'OK';
  } catch {
    return false;
  }
}

/** Axios-only CF login */
export async function loginToCF(
  handle: string,
  password: string
): Promise<CFLoginResult> {
  const enterUrl = 'https://codeforces.com/enter';

  let getRes: AxiosResponse;
  try {
    getRes = await axios.get(enterUrl, {
      headers: BROWSER_HEADERS,
      timeout: 20000,
      validateStatus: () => true,
    });
  } catch {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      errorMessage: 'Could not reach Codeforces',
    };
  }

  if (getRes.status !== 200) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      errorMessage: 'Could not reach Codeforces',
    };
  }

  const csrf = parseCsrfToken(String(getRes.data));
  if (!csrf) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      errorMessage: 'Could not parse login page',
    };
  }

  const initialCookies = extractCookiesFromResponse(getRes).sessionCookie;

  const body = new URLSearchParams({
    handleOrEmail: handle,
    password,
    csrf_token: csrf,
    action: 'enter',
    remember: 'on',
  }).toString();

  let postRes: AxiosResponse;
  try {
    postRes = await axios.post(enterUrl, body, {
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://codeforces.com',
        Referer: enterUrl,
        Cookie: initialCookies,
      },
      timeout: 20000,
      maxRedirects: 0,
      validateStatus: () => true,
    });
  } catch {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      errorMessage: 'Could not reach Codeforces',
    };
  }

  if (postRes.status === 429) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      errorMessage: 'Too many login attempts. Wait a few minutes.',
    };
  }

  const html = String(postRes.data);

  if (html.includes('Invalid handle or password')) {
    return {
      success: false,
      error: 'INVALID_CREDENTIALS',
      errorMessage: 'Wrong username or password',
    };
  }

  if (html.toLowerCase().includes('handle') && html.toLowerCase().includes('not found')) {
    return {
      success: false,
      error: 'HANDLE_NOT_FOUND',
      errorMessage: 'This Codeforces handle does not exist',
    };
  }

  const { sessionCookie, jsessionid } = extractCookiesFromResponse(postRes);
  const merged = [initialCookies, sessionCookie].filter(Boolean).join('; ');

  const location = postRes.headers.location as string | undefined;
  const redirectedHome = location === '/' || location === 'https://codeforces.com/';

  if (redirectedHome || merged.includes('JSESSIONID')) {
    return {
      success: true,
      sessionCookie: merged,
      jsessionid,
    };
  }

  if (merged.includes('JSESSIONID')) {
    return { success: true, sessionCookie: merged, jsessionid };
  }

  return {
    success: false,
    error: 'INVALID_CREDENTIALS',
    errorMessage: 'Login failed',
  };
}

/** Fetch submission source (requires logged-in session) */
export async function fetchSubmissionCode(
  contestId: number,
  submissionId: number,
  sessionCookie: string
): Promise<string | null> {
  const url = `https://codeforces.com/contest/${contestId}/submission/${submissionId}`;

  const res = await axios.get(url, {
    headers: { ...BROWSER_HEADERS, Cookie: sessionCookie },
    timeout: 20000,
    validateStatus: () => true,
  });

  if (res.status !== 200) return null;

  const $ = cheerio.load(String(res.data));
  let code = $('pre#program-source-text').text();
  if (!code.trim()) {
    code = $('div.source-code pre').text();
  }
  return code.trim() || null;
}

export function submissionPageUrl(
  contestId: number,
  submissionId: number
): string {
  return `https://codeforces.com/contest/${contestId}/submission/${submissionId}`;
}
