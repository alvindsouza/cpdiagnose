# CPDiagnose — Setup Guide
## Everything you need to insert to run this app

### 1. Supabase
1. Go to supabase.com → New project
2. Go to SQL Editor → paste the entire contents of schema.sql → Run
3. Go to Settings → API → copy these two values:
   - Project URL → paste into .env.local as NEXT_PUBLIC_SUPABASE_URL
   - anon public key → paste into .env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → paste into .env.local as SUPABASE_SERVICE_ROLE_KEY

### 2. AI (Ollama — local dev)
1. Install: brew install ollama
2. Start: ollama serve
3. Pull model: ollama pull codellama:7b  (4GB download, one time)
4. Verify: curl http://localhost:11434/api/tags
   You should see codellama:7b in the list.

### 3. Groq API (for prerequisite problems)
1. Go to console.groq.com → sign up free
2. Create API key
3. Paste into .env.local as GROQ_API_KEY

### 4. Run locally
npm install
docker-compose up -d      # starts Ollama (OR use brew install ollama above)
npm run dev
curl http://localhost:3000/api/health    # should return { ok: true }
Open http://localhost:3000

### 5. Deploy to Vercel
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import that repo
3. Add all env vars from .env.example in Vercel dashboard → Settings → Environment Variables
4. Deploy

### 6. Production AI (Ollama on Fly.io)
See fly.toml in ollama-server/ folder.
1. brew install flyctl
2. fly auth login
3. cd ollama-server && fly deploy
4. fly ssh console -C "ollama pull codellama:7b"
5. Set OLLAMA_MODE=remote and OLLAMA_REMOTE_URL in Vercel env vars
