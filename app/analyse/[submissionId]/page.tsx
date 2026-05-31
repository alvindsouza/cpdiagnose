import { Suspense } from 'react';
import { AnalyserWorkspace } from '@/components/analyser/workspace';

export default function AnalysePage({
  params,
}: {
  params: { submissionId: string };
}) {
  const submissionId = Number(params.submissionId);

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center text-on-surface-variant">
          Loading…
        </div>
      }
    >
      <AnalyserWorkspace submissionId={submissionId} />
    </Suspense>
  );
}
