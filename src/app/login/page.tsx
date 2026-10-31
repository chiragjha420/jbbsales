'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('rahul@jbb.in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setError(null);
    setLoading(true);

    const res = await login(quickEmail);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center pt-2">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Internal Systems
        </div>
        <ThemeToggle />
      </div>

      <div className="my-auto py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">JBB Sales</h1>
          <div className="text-sm text-muted-foreground mt-0.5">
            Jai Balaji Billiards · Commercial Sales & Profitability Portal
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs bg-danger-surface text-danger border border-danger/30 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase text-muted-foreground mb-1.5">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="salesperson@jbb.in"
              className="w-full p-2.5 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:border-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary-hover font-medium text-sm rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Sales Desk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>Select Team Member Account</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('rahul@jbb.in')}
              className="p-2.5 text-left border border-border hover:bg-surface rounded transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-foreground">Rahul Sharma</div>
                <div className="text-muted-foreground text-[11px]">rahul@jbb.in</div>
              </div>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">Salesperson</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('amit@jbb.in')}
              className="p-2.5 text-left border border-border hover:bg-surface rounded transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-foreground">Amit Verma</div>
                <div className="text-muted-foreground text-[11px]">amit@jbb.in</div>
              </div>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">Salesperson</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@jbb.in')}
              className="p-2.5 text-left border border-border hover:bg-surface rounded transition-colors flex justify-between items-center"
            >
              <div>
                <div className="font-semibold text-foreground">JBB Management</div>
                <div className="text-muted-foreground text-[11px]">admin@jbb.in</div>
              </div>
              <span className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded font-mono font-semibold">
                Admin
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground text-center pb-2">
        Authorised internal personnel only · Jai Balaji Billiards
      </div>
    </div>
  );
}
