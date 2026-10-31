'use client';

import React from 'react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="inline-flex items-center border border-border rounded p-0.5 bg-surface text-xs">
      <button
        type="button"
        onClick={() => setMode('light')}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          mode === 'light'
            ? 'bg-background text-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('dark')}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          mode === 'dark'
            ? 'bg-background text-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setMode('device')}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          mode === 'device'
            ? 'bg-background text-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="System Preference"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Device</span>
      </button>
    </div>
  );
}
