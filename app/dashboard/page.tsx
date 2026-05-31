'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SubmissionTableSkeleton } from '@/components/cp/submission-table-skeleton';
import { VerdictBadge } from '@/components/cp/verdict-badge';
import type { CFSubmission } from '@/lib/codeforces';

type Row = CFSubmission & { submittedAt: string };

type VerdictFilter =
  | 'all'
  | 'OK'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR';

export default function DashboardPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Row[]>([]);
  const [cachedIds, setCachedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<VerdictFilter>('all');
  const [search, setSearch] = useState('');

  function load() {
    setLoading(true);
    setError(null);
    fetch('/api/submissions')
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/?message=Please+log+in');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.error) {
          setError('Failed to load submissions');
          return;
        }
        setSubmissions(data.submissions ?? []);
        setCachedIds(new Set(data.cachedSubmissionIds ?? []));
      })
      .catch(() => setError('Failed to load submissions'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [router]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (filter !== 'all' && s.verdict !== filter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.problemName.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        `${s.contestId}${s.problemIndex}`.toLowerCase().includes(q)
      );
    });
  }, [submissions, filter, search]);

  function openAnalyse(sub: Row) {
    sessionStorage.setItem('submission', JSON.stringify(sub));
    router.push(
      `/analyse/${sub.id}?contestId=${sub.contestId}&problemIndex=${sub.problemIndex}`
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex font-body-sm antialiased selection:bg-secondary-container selection:text-on-secondary-container bg-[#0a0a0a]">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="flex justify-between items-center px-section-margin py-4 shrink-0">
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Submissions
          </h1>
          <div className="relative flex items-center group">
            <span className="material-symbols-outlined absolute left-2.5 text-on-surface-variant text-[16px] pointer-events-none group-focus-within:text-secondary transition-colors">
              search
            </span>
            <input
              className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT pl-8 pr-3 py-1.5 font-mono-sm text-mono-sm text-on-surface w-64 focus:outline-none focus:border-secondary transition-colors placeholder:text-outline"
              placeholder="Search ID, Problem, Contest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="px-section-margin pb-2 flex gap-2 shrink-0">
          {(
            [
              'all',
              'WRONG_ANSWER',
              'TIME_LIMIT_EXCEEDED',
              'RUNTIME_ERROR',
              'OK',
            ] as VerdictFilter[]
          ).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={`px-2 py-1 rounded-DEFAULT font-mono-sm text-mono-sm border border-outline-variant ${
                filter === v
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {v === 'all' ? 'All' : v.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto px-section-margin pb-section-margin">
          {loading ? (
            <SubmissionTableSkeleton />
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-error">{error}</p>
              <button
                type="button"
                onClick={load}
                className="px-4 py-2 bg-secondary-container text-on-secondary-container rounded-DEFAULT font-body-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="border border-outline-variant rounded-DEFAULT bg-surface-container-lowest overflow-hidden">
              <div className="overflow-auto max-h-[calc(100vh-200px)]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                    <tr className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Problem</th>
                      <th className="px-4 py-3">Verdict</th>
                      <th className="px-4 py-3">Lang</th>
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-surface-container-low cursor-pointer transition-colors"
                        onClick={() => openAnalyse(s)}
                      >
                        <td className="px-4 py-3 font-mono-sm text-mono-sm text-on-surface-variant">
                          {s.id}
                          {cachedIds.has(s.id) && (
                            <span className="ml-2 text-secondary" title="Cached analysis">
                              ⚡
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-headline-sm text-headline-sm text-primary">
                            {s.contestId}
                            {s.problemIndex} — {s.problemName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <VerdictBadge verdict={s.verdict} />
                        </td>
                        <td className="px-4 py-3 font-mono-sm text-mono-sm text-on-surface-variant max-w-[140px] truncate">
                          {s.language}
                        </td>
                        <td className="px-4 py-3 font-mono-sm text-mono-sm text-on-surface-variant">
                          {new Date(s.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {s.verdict !== 'OK' && (
                            <span className="text-secondary font-headline-sm text-headline-sm">
                              Diagnose →
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
