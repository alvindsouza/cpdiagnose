# Deploy CPDiagnose to Vercel — exact steps

## Before you start

1. **Supabase:** Run `schema.sql` in Supabase → SQL Editor (one time).
2. **Together.ai** (for AI on Vercel — required): https://api.together.ai → sign up → create API key.  
   (Groq is only for the “Practice” tab, not main diagnosis.)
3. **`.env.local`** works locally — do not commit it (already gitignored).

---

## Part A — Put code on GitHub

Open **Git Bash** or Terminal in the project folder:

```bash
cd /Users/alvindsouza/cfanalysis

git init
git add .
git commit -m "Initial CPDiagnose deploy"

# Create a new EMPTY repo on github.com (no README), then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub repo.

---

## Part B — Vercel environment variables

Go to **vercel.com** → sign in with GitHub → **Add New Project** → import your repo.

**Before clicking Deploy**, open **Environment Variables** and add **every** row below.  
Apply to: **Production**, **Preview**, and **Development**.

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cridihvtssqpnchfttcq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role JWT |
| `CF_SESSION_SECRET` | your 64-char secret |
| `GROQ_API_KEY` | your Groq `gsk_...` key |
| `OLLAMA_MODE` | `together` |
| `TOGETHER_API_KEY` | from together.ai (not Groq) |
| `TOGETHER_BASE_URL` | `https://api.together.xyz/v1` |

**Do not** set `OLLAMA_MODE=local` on Vercel — there is no Ollama on Vercel’s servers.

Then click **Deploy**. Wait for the build to finish (~2–3 min).

Your live URL will be like: `https://your-repo-name.vercel.app`

---

## Part C — Verify production

1. Open your Vercel URL → log in with Codeforces handle + password.
2. Open **Dashboard** → submissions load.
3. Click **Diagnose** on a failed submission → analysis runs (uses Together).
4. Visit `https://your-app.vercel.app/api/health` → should show `"ok": true` when Together key is valid.

---

## Part D — Redeploy after changing env vars

Vercel → your project → **Settings** → **Environment Variables** → edit →  
**Deployments** → latest → **⋯** → **Redeploy**.

---

## Common failures

| Problem | Fix |
|---------|-----|
| Build fails: `OLLAMA_MODE=together requires TOGETHER_API_KEY` | Add `TOGETHER_API_KEY` in Vercel env, redeploy |
| Login works but diagnosis fails | Check Together key; hit `/api/health` |
| “Not authenticated” on dashboard | Log in again; check `cf_handle` cookie (HTTPS) |
| Database errors | Re-run `schema.sql` in Supabase |

---

## What you do NOT upload to Vercel

- `.env.local` — enter vars in Vercel dashboard only
- `node_modules` / `.next` — Vercel builds these
- Supabase keys in GitHub — never commit secrets
