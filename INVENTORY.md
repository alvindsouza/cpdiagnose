# STEP 1 — File inventory

## competitive-programming-components/

| File | What it is | Action |
|------|------------|--------|
| `components/cp/login-form.tsx` | Login form UI | **use as-is** → `components/cp/` |
| `components/cp/landing-page.tsx` | Landing shell (mock login) | **adapt** → wire `app/page.tsx` |
| `components/cp/analyse-button.tsx` | Primary CTA button | **use as-is** |
| `components/cp/verdict-badge.tsx` | Verdict display | **use as-is** |
| `components/cp/problem-tag-pill.tsx` | Tag pill | **use as-is** |
| `components/cp/error-severity-icon.tsx` | Severity icon | **use as-is** |
| `components/cp/submission-table-skeleton.tsx` | Loading skeleton | **use as-is** |
| `components/cp/feature-pill.tsx` | Feature bullet | **use as-is** |
| `components/cp/index.ts` | Barrel export | **use as-is** |
| `components/ui/*` (50+ files) | shadcn primitives | **use as-is** → `components/ui/` |
| `components/ui/sidebar.tsx` | App sidebar | **use as-is** (nav shell) |
| `lib/utils.ts` | `cn()` helper | **merge** → `lib/utils.ts` |
| `app/globals.css` | Tailwind v4 tokens | **adapt** → merge verdict vars into `app/globals.css` |
| `app/page.tsx`, `layout.tsx` | Standalone demo app | **discard** (replaced by integrated app) |
| `package.json`, configs | Separate Next app | **discard** |

## stitch/

| File | What it is | Action |
|------|------------|--------|
| `submissions.html` | Dashboard table layout (static) | **adapt** → `app/dashboard/page.tsx` |
| `algorefine_workspace.html` | Split IDE + editor (static) | **adapt** → `app/analyse/[submissionId]/page.tsx` |
| `wronganswer_analysis.html` | Analysis right panel (static) | **merge** into analyse page tabs |
| `practice_reccomendations.html` | Practice tab layout (static) | **merge** into analyse Practice tab |

## jules_session_3975539484632858768/

| File | What it is | Action |
|------|------------|--------|
| `lib/piston.ts` | Piston API (`executeCode`) | **adapt** → `lib/piston.ts` |
| `lib/cf-submit.ts` | CF submit (`submitSolution`) | **adapt** → `lib/cf-submit.ts` (fix cookies) |
| `package.json` | Jules deps only | **discard** |

## Existing cfanalysis root (pre-integration)

| Area | Action |
|------|--------|
| `lib/codeforces.ts`, `ai-client.ts`, `prereqs.ts`, `supabase.ts` | **merge** with spec updates |
| `app/api/*` | **rewrite** per STEP 7 |
| `middleware.ts` | **rewrite** → `cf_handle` cookie |
| `supabase/schema.sql` | **replace** → root `schema.sql` |
