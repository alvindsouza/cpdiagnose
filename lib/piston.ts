import axios from 'axios';

export interface PistonResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  compile_output: string;
  language: string;
  runtime_ms?: number;
}

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  'GNU G++17': { language: 'c++', version: '10.2.0' },
  'GNU G++17 7.3.0': { language: 'c++', version: '10.2.0' },
  'GNU G++14 6.4.0': { language: 'c++', version: '10.2.0' },
  'GNU G++20 11.2.0 (64 bit, winlib)': { language: 'c++', version: '10.2.0' },
  'Python 3': { language: 'python', version: '3.10.0' },
  'Python 3.8.12 (64 bit)': { language: 'python', version: '3.10.0' },
  'PyPy 3': { language: 'python', version: '3.10.0' },
  'PyPy 3.7.13 (7.3.9)': { language: 'python', version: '3.10.0' },
  'Java 11': { language: 'java', version: '15.0.2' },
  'Java 11.0.6': { language: 'java', version: '15.0.2' },
};

export async function executeCode(
  language: string,
  code: string,
  stdin?: string
): Promise<PistonResult> {
  const mapped =
    LANGUAGE_MAP[language] ??
    Object.entries(LANGUAGE_MAP).find(([k]) =>
      language.toLowerCase().includes(k.toLowerCase().split(' ')[0])
    )?.[1] ??
    { language: 'c++', version: '10.2.0' };

  try {
    const startMs = Date.now();
    const response = await axios.post(
      'https://emkc.org/api/v2/piston/execute',
      {
        language: mapped.language,
        version: mapped.version,
        files: [{ name: 'main', content: code }],
        stdin: stdin || '',
        compile_timeout: 10000,
        run_timeout: 5000,
      },
      { timeout: 12000 }
    );
    const runtime_ms = Date.now() - startMs;

    const data = response.data;
    const runResult = data.run || { stdout: '', stderr: '', code: 0, signal: null };
    const compileResult = data.compile;
    const compile_output = compileResult
      ? compileResult.output || compileResult.stderr || ''
      : '';
    const compileCode = compileResult ? compileResult.code : 0;

    if (compileResult && compileCode !== 0) {
      return {
        success: false,
        stdout: '',
        stderr: compileResult.stderr || compile_output || 'Compile error',
        exitCode: compileCode,
        compile_output,
        language: mapped.language,
        runtime_ms,
      };
    }

    const isTimeout =
      runResult.signal === 'SIGKILL' || runResult.signal === 'SIGTERM';
    if (isTimeout) {
      return {
        success: false,
        stdout: runResult.stdout || '',
        stderr: 'Time limit exceeded (10s)',
        exitCode: runResult.code ?? 1,
        compile_output,
        language: mapped.language,
        runtime_ms,
      };
    }

    return {
      success: runResult.code === 0,
      stdout: runResult.stdout || '',
      stderr: runResult.stderr || '',
      exitCode: runResult.code ?? 0,
      compile_output,
      language: mapped.language,
      runtime_ms,
    };
  } catch {
    return {
      success: false,
      stdout: '',
      stderr: 'Compiler service unavailable',
      exitCode: 1,
      compile_output: '',
      language: mapped.language,
    };
  }
}
