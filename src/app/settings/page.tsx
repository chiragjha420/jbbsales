'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  Settings,
  User,
  Shield,
  Smartphone,
  Database,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin, logout, switchUser } = useAuth();
  const { mode, resolvedTheme } = useTheme();

  return (
    <div className="p-3.5 md:p-6 max-w-3xl mx-auto space-y-5 pb-24">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">System Settings</h1>
        <div className="text-xs text-muted-foreground mt-0.5">
          Application configuration, user role profile, and appearance preferences
        </div>
      </div>

      {/* User Identity Profile */}
      <div className="p-4 bg-surface border border-border rounded space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Active Operator Profile</span>
          </div>
          {isAdmin ? (
            <span className="text-[10px] bg-foreground text-background font-mono px-2 py-0.5 rounded font-bold uppercase">
              Administrator
            </span>
          ) : (
            <span className="text-[10px] bg-muted text-muted-foreground font-mono px-2 py-0.5 rounded font-bold uppercase">
              Salesperson
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Full Name</span>
            <span className="font-bold text-sm text-foreground">{user?.full_name || 'Loading...'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Registered Email</span>
            <span className="font-semibold text-foreground">{user?.email || 'Loading...'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Phone</span>
            <span className="font-medium text-foreground">{user?.phone || 'Not configured'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Status</span>
            <span className="text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>
        </div>

        {/* Switch Account */}
        <div className="pt-3 border-t border-border">
          <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1.5">
            Switch Account for Verification
          </label>
          <select
            value={user?.email || 'rahul@jbb.in'}
            onChange={(e) => switchUser(e.target.value)}
            className="w-full sm:w-auto text-xs p-2 bg-background border border-border rounded text-foreground focus:outline-none"
          >
            <option value="admin@jbb.in">Admin (JBB Management)</option>
            <option value="rahul@jbb.in">Rahul Sharma (Salesperson)</option>
            <option value="amit@jbb.in">Amit Verma (Salesperson)</option>
            <option value="suresh@jbb.in">Suresh Patel (Salesperson)</option>
          </select>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="p-4 bg-surface border border-border rounded space-y-3">
        <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide">
          Display & Appearance
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <div className="font-medium text-foreground">Theme Mode</div>
            <div className="text-muted-foreground text-[11px]">
              Select White Light, True Black Dark, or Device OS preference
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Database & Storage Status */}
      <div className="p-4 bg-surface border border-border rounded space-y-2 text-xs">
        <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          <span>Database & Storage Architecture</span>
        </div>
        <div className="text-muted-foreground space-y-1 text-[11px]">
          <div>• Database Engine: <strong className="text-foreground">PostgreSQL / Supabase Schema</strong></div>
          <div>• Payment Proof Storage: <strong className="text-foreground">Private Authenticated Bucket</strong></div>
          <div>• Historical Integrity: <strong className="text-foreground">Snapshot Cost at Sale Time</strong></div>
          <div>• Fallback Engine: <strong className="text-foreground">Persistent Atomic Transaction Store</strong></div>
        </div>
      </div>

      {/* PWA & Mobile Installation */}
      <div className="p-4 bg-surface border border-border rounded space-y-2 text-xs">
        <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Progressive Web App (PWA) on Android</span>
        </div>
        <div className="text-muted-foreground text-[11px] space-y-1">
          <div>1. Open this portal in Chrome or Edge on your Android phone.</div>
          <div>2. Tap the browser menu (three dots) in the upper-right corner.</div>
          <div>3. Tap <strong className="text-foreground">&quot;Install app&quot;</strong> or <strong className="text-foreground">&quot;Add to Home screen&quot;</strong>.</div>
          <div>4. JBB Sales will run full-screen as a standalone native-feeling business app.</div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="w-full py-2.5 px-4 border border-danger/40 text-danger hover:bg-danger-surface font-semibold text-xs rounded transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of JBB Sales</span>
        </button>
      </div>
    </div>
  );
}
