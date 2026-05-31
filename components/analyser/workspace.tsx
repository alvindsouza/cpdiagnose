'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import type { editor } from 'monaco-editor';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ErrorSeverityIcon } from '@/components/cp/error-severity-icon';
import { ProblemTagPill } from '@/components/cp/problem-tag-pill';
import type { AnalysisResult, AnalysisError } from '@/lib/ai-client';
import type { PistonResult } from '@/lib/piston';
import { parseCodeFromHtml } from '@/lib/parse-submission-html';
import type { CFSubmission } from '@/lib/codeforces';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-on-surface-variant">
      Loading editor…
    </div>
  ),
});

type StoredSub = CFSubmission & { submittedAt?: string };
type Tab = 'analysis' | 'practice' | 'output';

function mapMonacoLang(cfLang: string): string {
  const l = cfLang.toLowerCase();
  if (l.includes('c++')) return 'cpp';
  if (l.includes('python') || l.includes('pypy')) return 'python';
  if (l.includes('java')) return 'java';
  return 'plaintext';
}

function decorationClass(err: AnalysisError): string {
  if (err.severity === 'critical') return 'error-critical';
  if (err.severity === 'warning') return 'error-warning';
  if (err.type === 'efficiency' || err.severity === 'suggestion')
    return 'error-efficiency';
  return 'error-warning';
}

export function AnalyserWorkspace({ submissionId }: { submissionId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = Number(searchParams.get('contestId'));
  const problemIndex = searchParams.get('problemIndex') ?? '';

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  const [sub, setSub] = useState<StoredSub | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('GNU G++17');
  const [codeLoading, setCodeLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<(AnalysisResult & { cached?: boolean }) | null>(null);
  const [activeErrorId, setActiveErrorId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('analysis');
  const [compileResult, setCompileResult] = useState<PistonResult | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prereqs, setPrereqs] = useState<
    Array<{
      problemId: string;
      problemName: string;
      rating: number;
      whyThisHelps: string;
      cfUrl: string;
    }>
  >([]);

  const applyDecorations = useCallback(
    (errs: AnalysisError[], editor: editor.IStandaloneCodeEditor) => {
      decorationsRef.current?.clear();
      decorationsRef.current = editor.createDecorationsCollection(
        errs.map((err) => ({
          range: {
            startLineNumber: err.line_start,
            startColumn: err.col_start || 1,
            endLineNumber: err.line_end,
            endColumn: err.col_end || 1,
          },
          options: {
            className: decorationClass(err),
            isWholeLine: err.col_start <= 1 && err.col_end <= 1,
            hoverMessage: { value: err.short_description },
          },
        }))
      );
    },
    []
  );

  useEffect(() => {
    let stored: StoredSub | null = null;
    try {
      const raw = sessionStorage.getItem('submission');
      if (raw) stored = JSON.parse(raw) as StoredSub;
    } catch {
      stored = null;
    }

    if (stored && stored.id === submissionId) {
      setSub(stored);
      setLanguage(stored.language);
      return;
    }

    fetch('/api/submissions')
      .then((r) => r.json())
      .then((data) => {
        const found = (data.submissions ?? []).find(
          (s: StoredSub) => s.id === submissionId
        );
        if (found) {
          setSub(found);
          setLanguage(found.language);
        } else {
          router.replace('/dashboard');
        }
      });
  }, [submissionId, router]);

  useEffect(() => {
    if (!contestId || !submissionId) return;

    setCodeLoading(true);
    fetch(
      `/api/submission-code?contestId=${contestId}&submissionId=${submissionId}&language=${encodeURIComponent(language)}`
    )
      .then((r) => r.json())
      .then(async (data) => {
        if (data.code) {
          setCode(data.code);
          if (data.language) setLanguage(data.language);
          return;
        }
        if (data.requiresClientFetch && data.url) {
          const res = await fetch(data.url, { credentials: 'include' });
          const html = await res.text();
          const clientCode = parseCodeFromHtml(html);
          if (clientCode) setCode(clientCode);
        }
      })
      .finally(() => setCodeLoading(false));
  }, [contestId, submissionId, language]);

  async function runAnalysis() {
    if (!sub) return;
    setIsAnalysing(true);
    setTab('analysis');
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: sub.id,
          problemName: sub.problemName,
          problemRating: sub.rating,
          problemTags: sub.tags,
          code,
          language,
          verdict: sub.verdict,
          passedTestCount: sub.passedTestCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? 'Analysis failed');
        return;
      }
      setAnalysis(data);
      if (data.errors?.[0]) {
        setActiveErrorId(data.errors[0].id);
        setExpandedId(data.errors[0].id);
      }
      if (editorRef.current && data.errors) {
        applyDecorations(data.errors, editorRef.current);
      }
    } finally {
      setIsAnalysing(false);
    }
  }

  async function runCompile() {
    setCompiling(true);
    setTab('output');
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin: '' }),
      });
      const data = await res.json();
      setCompileResult(data);
    } finally {
      setCompiling(false);
    }
  }

  async function runSubmit() {
    if (!sub) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId: sub.contestId,
          problemIndex: sub.problemIndex,
          language,
          code,
        }),
      });
      const data = await res.json();
      if (data.error === 'CF_BLOCKED' && data.problemUrl) {
        window.open(data.problemUrl, '_blank');
        return;
      }
      if (data.success) {
        await runAnalysis();
      } else {
        alert(data.message ?? 'Submit failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function loadPrereqs() {
    if (!analysis) return;
    const maxRating = sub?.rating ? sub.rating - 100 : 1500;
    const params = new URLSearchParams({
      topics: analysis.prereq_topics.join(','),
      conceptualGap: analysis.conceptual_gap,
      maxRating: String(maxRating),
    });
    fetch(`/api/prereqs?${params}`)
      .then((r) => r.json())
      .then((d) => setPrereqs(d.problems ?? []));
  }

  if (!sub) {
    return (
      <div className="h-screen flex items-center justify-center text-on-surface-variant">
        Loading submission…
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface h-screen w-full flex overflow-hidden font-body-sm select-none">
      <AppSidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <header className="bg-background border-b border-outline-variant flex justify-between items-center px-4 h-12 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              {sub.problemName}
            </h1>
            <div className="flex items-center gap-2">
              {sub.rating && (
                <span className="bg-surface-container-high text-on-surface px-2 py-0.5 rounded-sm font-mono-sm text-mono-sm">
                  ★{sub.rating}
                </span>
              )}
              {sub.tags.map((t) => (
                <ProblemTagPill key={t} tag={t} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runCompile}
              disabled={compiling}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container-highest border border-outline-variant text-primary hover:bg-surface-container-high font-body-sm"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              Run
            </button>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={isAnalysing || codeLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-on-primary hover:bg-[#e6e6e6] font-body-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              {isAnalysing ? 'Analysing…' : 'Diagnose'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing((e) => !e)}
              className="px-3 py-1.5 rounded border border-outline-variant text-on-surface-variant hover:text-primary font-body-sm"
            >
              {isEditing ? 'Lock editor' : 'Edit & resubmit'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={runSubmit}
                disabled={submitting}
                className="px-3 py-1.5 rounded bg-secondary-container text-on-secondary-container font-body-sm"
              >
                Submit to CF
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <section className="w-[55%] flex flex-col h-full border-r border-outline-variant bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-3 h-8 border-b border-outline-variant bg-surface-container-lowest shrink-0">
              <span className="text-secondary font-body-sm border-b border-secondary pb-1 translate-y-[5px]">
                solution
              </span>
            </div>
            <div className="flex-1 min-h-0">
              {codeLoading ? (
                <div className="h-full flex items-center justify-center text-on-surface-variant">
                  Loading source…
                </div>
              ) : (
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  language={mapMonacoLang(language)}
                  value={code}
                  onChange={(v) => setCode(v ?? '')}
                  options={{
                    readOnly: !isEditing,
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                  }}
                  onMount={(ed, monaco) => {
                    editorRef.current = ed;
                    ed.onMouseDown((e) => {
                      const line = e.target.position?.lineNumber;
                      if (!line || !analysis?.errors) return;
                      const hit = analysis.errors.find(
                        (err) =>
                          line >= err.line_start && line <= err.line_end
                      );
                      if (hit) {
                        setActiveErrorId(hit.id);
                        setExpandedId(hit.id);
                        setTab('analysis');
                      }
                    });
                    if (analysis?.errors) {
                      applyDecorations(analysis.errors, ed);
                    }
                    monaco.editor.defineTheme('cpdiagnose', {
                      base: 'vs-dark',
                      inherit: true,
                      rules: [],
                      colors: {},
                    });
                  }}
                />
              )}
            </div>
          </section>

          <section className="w-[45%] flex flex-col h-full bg-background">
            <div className="flex border-b border-outline-variant shrink-0">
              {(['analysis', 'practice', 'output'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    if (t === 'practice') loadPrereqs();
                  }}
                  className={`px-4 py-2 font-headline-sm text-headline-sm capitalize border-b-2 ${
                    tab === t
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  {t}
                </button>
              ))}
              {analysis && (
                <span className="ml-auto self-center pr-4 font-mono-sm text-mono-sm text-on-surface-variant">
                  {analysis.cached ? '⚡ Instant — from cache' : 'Analysed fresh'}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'analysis' && (
                <div className="space-y-4">
                  {!analysis && !isAnalysing && (
                    <p className="text-on-surface-variant">
                      Click Diagnose to analyse this submission.
                    </p>
                  )}
                  {isAnalysing && (
                    <p className="text-on-surface-variant">AI is analysing…</p>
                  )}
                  {analysis && (
                    <>
                      <div className="border border-outline-variant rounded-DEFAULT p-4 bg-surface-container-lowest">
                        <p className="font-headline-sm text-headline-sm text-primary mb-2">
                          {analysis.one_line_summary}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                          {analysis.conceptual_gap}
                        </p>
                      </div>
                      {analysis.errors.map((err) => (
                        <div
                          key={err.id}
                          className={`border border-outline-variant rounded-DEFAULT p-3 cursor-pointer ${
                            activeErrorId === err.id
                              ? 'border-secondary bg-surface-container-low'
                              : ''
                          }`}
                          onClick={() => {
                            setActiveErrorId(err.id);
                            setExpandedId(
                              expandedId === err.id ? null : err.id
                            );
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <ErrorSeverityIcon severity={err.severity} />
                            <span className="font-mono-sm text-mono-sm text-on-surface-variant">
                              L{err.line_start}
                              {err.line_end !== err.line_start
                                ? `–${err.line_end}`
                                : ''}
                            </span>
                            <span className="font-body-sm text-body-sm text-primary">
                              {err.short_description}
                            </span>
                          </div>
                          {expandedId === err.id && (
                            <div className="mt-2 space-y-2 font-body-sm text-body-sm text-on-surface-variant">
                              <p>{err.full_explanation}</p>
                              <p className="flex gap-2">
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  lightbulb
                                </span>
                                {err.correct_intuition}
                              </p>
                              {err.visual_hint && (
                                <pre className="bg-[#0a0a0a] p-2 rounded font-mono-sm text-mono-sm overflow-x-auto">
                                  {err.visual_hint}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {tab === 'practice' && (
                <div className="space-y-3">
                  {prereqs.length === 0 ? (
                    <p className="text-on-surface-variant text-body-sm">
                      Open this tab after diagnosis to load practice problems.
                    </p>
                  ) : (
                    prereqs.map((p) => (
                      <a
                        key={p.problemId}
                        href={p.cfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-outline-variant rounded-DEFAULT p-3 hover:border-secondary"
                      >
                        <div className="font-headline-sm text-headline-sm text-primary">
                          {p.problemId} — {p.problemName}
                        </div>
                        <div className="font-mono-sm text-mono-sm text-on-surface-variant">
                          ★{p.rating}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          {p.whyThisHelps}
                        </p>
                      </a>
                    ))
                  )}
                </div>
              )}

              {tab === 'output' && (
                <div className="font-mono-sm text-mono-sm space-y-2">
                  {compiling && <p>Running on Piston…</p>}
                  {compileResult && (
                    <>
                      <p className="text-on-surface-variant">
                        exit {compileResult.exitCode}
                      </p>
                      <pre className="bg-[#0a0a0a] p-2 rounded whitespace-pre-wrap">
                        {compileResult.stdout || '(no stdout)'}
                      </pre>
                      {compileResult.stderr && (
                        <pre className="bg-[#0a0a0a] p-2 rounded text-error whitespace-pre-wrap">
                          {compileResult.stderr}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
