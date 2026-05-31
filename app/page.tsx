'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/cp/login-form';
import { FeaturePill } from '@/components/cp/feature-pill';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const banner = searchParams.get('message') ?? searchParams.get('session');

  async function handleLogin(username: string, password: string) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/codeforces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard');
        return;
      }

      switch (data.error) {
        case 'HANDLE_NOT_FOUND':
          setError(
            "This Codeforces handle doesn't exist. Double-check your username."
          );
          break;
        case 'INVALID_CREDENTIALS':
          setError('Wrong password. Try again.');
          break;
        case 'RATE_LIMITED':
          setError('Too many attempts. Wait a few minutes and try again.');
          break;
        case 'NETWORK_ERROR':
          setError("Can't reach Codeforces right now. Check your connection.");
          break;
        default:
          setError('Something went wrong. Please try again.');
      }
    } catch {
      setError("Can't reach Codeforces right now. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#0a0a0a]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-display text-primary tracking-tight text-balance">
            Why did you get it wrong?
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-pretty">
            Connect your Codeforces account. We show which mental model you are
            missing — not just the answer.
          </p>
        </div>

        {banner && (
          <p className="text-sm text-secondary text-center">
            {banner === 'expired' ? 'Session expired. Please log in again.' : banner}
          </p>
        )}

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} disabled={isLoading} />

        {error && (
          <p className="text-sm text-error text-center" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <FeaturePill>Underlines your exact mistake</FeaturePill>
          <FeaturePill>Explains the intuition gap</FeaturePill>
          <FeaturePill>Suggests easier warm-up problems</FeaturePill>
        </div>

        <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
          Credentials go only to Codeforces for login. Passwords are never stored.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <LoginContent />
    </Suspense>
  );
}
