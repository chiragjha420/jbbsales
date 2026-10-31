'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both your work email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-sm mx-auto">
      <div className="py-2">
        {/* Intentionally minimal top bar */}
      </div>

      <div className="my-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">JBB Sales</h1>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs bg-danger-surface text-danger border border-danger/30 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="salesperson@jbb.in"
              className="w-full p-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-sm rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-[11px] text-muted-foreground text-center pb-3">
        Jai Balaji Billiards
      </div>
    </div>
  );
}
