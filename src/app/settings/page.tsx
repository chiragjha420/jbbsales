'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  User,
  Package,
  PlusCircle,
  LogOut,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isAdmin, logout } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <div className="p-3.5 md:p-6 max-w-2xl mx-auto space-y-5 pb-24">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* User Profile */}
      <div className="p-4 bg-surface border border-border rounded space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </div>
          {isAdmin ? (
            <span className="text-[10px] bg-foreground text-background font-mono px-2 py-0.5 rounded font-bold uppercase">
              Admin
            </span>
          ) : (
            <span className="text-[10px] bg-muted text-muted-foreground font-mono px-2 py-0.5 rounded font-bold uppercase">
              Salesperson
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Name</span>
            <span className="font-bold text-sm text-foreground">{user?.full_name || 'Loading...'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Email</span>
            <span className="font-semibold text-foreground">{user?.email || 'Loading...'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Phone</span>
            <span className="font-medium text-foreground">{user?.phone || 'Not configured'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase">Role</span>
            <span className="font-medium text-foreground uppercase">{user?.role || 'Salesperson'}</span>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="p-4 bg-surface border border-border rounded space-y-3">
        <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide">
          Appearance
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('light')}
            className={`p-3 border rounded text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
              mode === 'light'
                ? 'bg-foreground text-background border-foreground font-semibold'
                : 'border-border text-foreground hover:bg-card'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('dark')}
            className={`p-3 border rounded text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
              mode === 'dark'
                ? 'bg-foreground text-background border-foreground font-semibold'
                : 'border-border text-foreground hover:bg-card'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('device')}
            className={`p-3 border rounded text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
              mode === 'device'
                ? 'bg-foreground text-background border-foreground font-semibold'
                : 'border-border text-foreground hover:bg-card'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Device</span>
          </button>
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="p-4 bg-surface border border-border rounded space-y-2">
        <div className="font-semibold text-xs uppercase text-muted-foreground tracking-wide">
          Quick Access
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <Link
            href="/products"
            className="p-2.5 bg-background border border-border rounded hover:bg-card text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Product Catalog</span>
            </div>
          </Link>
          <Link
            href="/sales/new"
            className="p-2.5 bg-background border border-border rounded hover:bg-card text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Create New Sale</span>
            </div>
          </Link>
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
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
