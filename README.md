# CPDiagnose

AI-powered competitive programming diagnosis for Codeforces submissions.

## Deployment

1. **Clone repo**

   ```bash
   git clone <your-repo-url>
   cd cpdiagnose
   npm install
   ```

2. **Supabase**

   ```bash
   npx supabase login && supabase init
   ```

3. **Push schema**

   ```bash
   psql "$DATABASE_URL" < supabase/schema.sql
   ```

   Or paste `supabase/schema.sql` into the Supabase SQL editor.

4. **Start Ollama locally**

   ```bash
   docker-compose up -d
   ```

   First run pulls `codellama:7b` (~4GB, takes a few minutes).

   **Or:**

   ```bash
   brew install ollama && ollama serve && ollama pull codellama:7b
   ```

5. **Verify AI is running**

   ```bash
   npm run dev
   curl http://localhost:3000/api/health
   ```

6. **Deploy**

   ```bash
   vercel deploy
   ```

7. **Set env vars in Vercel dashboard**

   Use `OLLAMA_MODE=remote` or `together` for production. See `.env.local` template.

8. **Deploy Ollama server on Fly.io**

   ```bash
   cd ollama-server && fly deploy
   ```

9. **Done** — the app is live.

## Configuration reference

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | `createBrowserClient`, `createServerClient`, `createServiceClient` |
| `lib/cookie-crypto.ts` | AES-256-GCM encrypt/decrypt for `cf_sessions` |
| `middleware.ts` | Protects `/dashboard`, `/analyse/*` |
| `supabase/schema.sql` | Tables + RLS policies |
| `next.config.ts` | Image domains + `OLLAMA_MODE` validation |
| `vercel.json` | Vercel deployment config |
| `.env.local` | Local env template |

## Supabase clients

- **`createBrowserClient()`** — client components (`@supabase/ssr`)
- **`createServerClient()`** — API routes / server components
- **`createServiceClient()`** — service role for diagnoses + encrypted CF session writes

CF session cookies are encrypted with `CF_SESSION_SECRET` before storage; decrypted on read in submission-code/submit routes.

## RLS summary

- **`cf_sessions`:** only `auth.uid() = user_id` can read/write
- **`diagnoses`:** public SELECT; INSERT/UPDATE via service role only
- **`problem_prerequisites`:** public SELECT

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing + login |
| `/dashboard` | Submissions (protected) |
| `/analyse/[id]` | Analyser (protected) |
| `GET /api/health` | Ollama/Together health check |
