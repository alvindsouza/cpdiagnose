/** @type {import('next').NextConfig} */

const VALID_OLLAMA_MODES = ['local', 'remote', 'together'];

function validateEnv() {
  const mode = process.env.OLLAMA_MODE || 'local';
  if (!VALID_OLLAMA_MODES.includes(mode)) {
    throw new Error(
      `Invalid OLLAMA_MODE "${mode}". Must be one of: ${VALID_OLLAMA_MODES.join(', ')}`
    );
  }
  if (mode === 'remote' && !process.env.OLLAMA_REMOTE_URL) {
    throw new Error('OLLAMA_MODE=remote requires OLLAMA_REMOTE_URL');
  }
  if (mode === 'together' && !process.env.TOGETHER_API_KEY) {
    throw new Error('OLLAMA_MODE=together requires TOGETHER_API_KEY');
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
