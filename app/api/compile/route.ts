import { NextRequest, NextResponse } from 'next/server';
import { executeCode } from '@/lib/piston';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const language = String(body.language ?? 'GNU G++17');
    const code = String(body.code ?? '');
    const stdin = body.stdin ? String(body.stdin) : '';

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    const result = await executeCode(language, code, stdin);

    if (result.stderr === 'Compiler service unavailable') {
      return NextResponse.json(
        { error: 'COMPILER_UNAVAILABLE' },
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Compile error:', err);
    return NextResponse.json(
      { error: 'COMPILER_UNAVAILABLE' },
      { status: 503 }
    );
  }
}
