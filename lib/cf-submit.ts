import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SubmitParams {
  contestId: number;
  problemIndex: string;
  languageName: string;
  code: string;
  sessionCookie: string;
  jsessionid?: string;
}

export interface SubmitResult {
  success: boolean;
  submissionId?: number;
  error?: 'same_code' | 'invalid_session' | 'cloudflare_blocked' | 'unknown';
  message?: string;
}

const CF_LANG_IDS: Record<string, number> = {
  'GNU G++17': 73,
  'GNU G++17 7.3.0': 54,
  'GNU G++14 6.4.0': 50,
  'GNU G++20 11.2.0 (64 bit, winlib)': 73,
  'Python 3': 31,
  'Python 3.8.12 (64 bit)': 31,
  'PyPy 3': 41,
  'PyPy 3.7.13 (7.3.9)': 41,
  'Java 11': 60,
  'Java 11.0.6': 60,
};

function resolveLangId(languageName: string): number {
  if (CF_LANG_IDS[languageName]) return CF_LANG_IDS[languageName];
  const l = languageName.toLowerCase();
  if (l.includes('c++')) return 73;
  if (l.includes('pypy')) return 41;
  if (l.includes('python')) return 31;
  if (l.includes('java')) return 60;
  return 73;
}

export async function submitSolution(params: SubmitParams): Promise<SubmitResult> {
  const { contestId, problemIndex, languageName, code, sessionCookie } = params;
  const url = `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    Cookie: sessionCookie,
  };

  try {
    const getResponse = await axios.get(url, {
      headers,
      validateStatus: () => true,
      maxRedirects: 0,
      timeout: 20000,
    });

    const html = String(getResponse.data);
    if (
      getResponse.status === 403 ||
      html.includes('Just a moment') ||
      html.toLowerCase().includes('cloudflare')
    ) {
      return {
        success: false,
        error: 'cloudflare_blocked',
        message: 'Submit directly on Codeforces',
      };
    }

    const $ = cheerio.load(html);
    const csrfToken =
      $('meta[name="X-Csrf-Token"]').attr('content') ??
      $('input[name="csrf_token"]').attr('value');

    if (!csrfToken) {
      return {
        success: false,
        error: 'invalid_session',
        message: 'Could not extract CSRF token. Invalid session?',
      };
    }

    const programTypeId = resolveLangId(languageName);
    const formParams = new URLSearchParams({
      csrf_token: csrfToken,
      action: 'submitSolution',
      submittedProblemIndex: problemIndex,
      source: code,
      tabSize: '4',
      programTypeId: String(programTypeId),
    });

    const postResponse = await axios.post(url, formParams.toString(), {
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://codeforces.com',
        Referer: url,
      },
      validateStatus: () => true,
      maxRedirects: 0,
      timeout: 20000,
    });

    const postHtml = String(postResponse.data);
    if (
      postResponse.status === 403 ||
      postHtml.includes('Just a moment') ||
      postHtml.toLowerCase().includes('cloudflare')
    ) {
      return {
        success: false,
        error: 'cloudflare_blocked',
        message: 'Submit directly on Codeforces',
      };
    }

    const location = postResponse.headers.location as string | undefined;
    if (location?.includes('/submission/')) {
      const match = location.match(/submission\/(\d+)/);
      return {
        success: true,
        submissionId: match ? parseInt(match[1], 10) : undefined,
      };
    }

    if (postResponse.status === 302 && location?.includes('/my')) {
      return { success: true };
    }

    if (postHtml.includes('You have submitted exactly the same code')) {
      return {
        success: false,
        error: 'same_code',
        message: 'You have submitted exactly the same code',
      };
    }

    const errorMsg = cheerio.load(postHtml)('.error').text().trim();
    if (errorMsg) {
      return { success: false, error: 'unknown', message: errorMsg };
    }

    return { success: false, error: 'unknown', message: 'Submission failed' };
  } catch (err) {
    return {
      success: false,
      error: 'unknown',
      message: err instanceof Error ? err.message : 'Network error',
    };
  }
}
