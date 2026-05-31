# Credentials Template

## File: .env.local (local development)
(Copy this, fill in values, never commit to git)

NEXT_PUBLIC_SUPABASE_URL=          ← from Supabase → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     ← from Supabase → Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=         ← from Supabase → Settings → API → service_role
CF_SESSION_SECRET=                 ← generate: openssl rand -hex 32

OLLAMA_MODE=local
OLLAMA_LOCAL_URL=http://localhost:11434
OLLAMA_MODEL=codellama:7b

GROQ_API_KEY=                      ← from console.groq.com

## Vercel Dashboard → Settings → Environment Variables
(Add every variable above here too, plus these production-only ones:)

OLLAMA_MODE=remote                 ← change to remote for production
OLLAMA_REMOTE_URL=                 ← your Fly.io Ollama URL
OLLAMA_API_KEY=                    ← generate: openssl rand -hex 32 (same value in fly.toml)

## Supabase SQL Editor
(Paste schema.sql here — already generated in your project root)

## Fly.io (for production Ollama server)
File: ollama-server/fly.toml is already generated.
Run: fly launch and fly deploy from that folder.
Then: fly ssh console -C "ollama pull codellama:7b"
