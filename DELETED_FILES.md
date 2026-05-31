# STEP 12 — Deleted files and where content went

## Folders removed (entire trees)

| Deleted | Integrated into |
|---------|-----------------|
| `competitive-programming-components/` | `components/ui/*`, `components/cp/*`, `lib/utils.ts` |
| `stitch/*.html` | `app/dashboard/page.tsx`, `components/analyser/workspace.tsx`, `components/layout/app-sidebar.tsx`, `tailwind.config.ts` |
| `jules_session_3975539484632858768/` | `lib/piston.ts`, `lib/cf-submit.ts` |

## Individual files removed

| Deleted | Replaced by |
|---------|-------------|
| `components/SubmissionTable.tsx` | `app/dashboard/page.tsx` (Stitch table) |
| `components/CodeEditor.tsx` | `components/analyser/workspace.tsx` (Monaco) |
| `components/AnalysisPanel.tsx` | `components/analyser/workspace.tsx` (Analysis tab) |
| `components/ErrorCard.tsx` | Inline cards in workspace |
| `components/PrereqProblems.tsx` | Practice tab in workspace |
| `components/CompileOutput.tsx` | Output tab in workspace |
| `lib/auth.ts` | `lib/session.ts` (`cf_handle` cookie) |
| `app/api/prerequisites/route.ts` | `app/api/prereqs/route.ts` |
| `next.config.ts` | `next.config.mjs` (Next.js 14) |
