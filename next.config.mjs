/** @type {import('next').NextConfig} */

const VALID_OLLAMA_MODES = ['local', 'remote', 'together', 'groq'];

function validateEnv() {
  const mode = (process.env.OLLAMA_MODE || 'local').trim().toLowerCase();
  if (!VALID_OLLAMA_MODES.includes(mode)) {
    throw new Error(
      `Invalid OLLAMA_MODE "${process.env.OLLAMA_MODE}". Use exactly one of: ${VALID_OLLAMA_MODES.join(', ')} — not a sentence; API keys go in their own variables.`
    );
  }
  if (mode === 'remote' && !process.env.OLLAMA_REMOTE_URL) {
    throw new Error('OLLAMA_MODE=remote requires OLLAMA_REMOTE_URL');
  }
  if (mode === 'together' && !process.env.TOGETHER_API_KEY) {
    throw new Error('OLLAMA_MODE=together requires TOGETHER_API_KEY');
  }
  if (mode === 'groq' && !process.env.GROQ_API_KEY) {
    throw new Error('OLLAMA_MODE=groq requires GROQ_API_KEY');
  }
}

validateEnv();

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
  images: {
    domains: ['codeforces.com'],
  },
};

export default nextConfig;
