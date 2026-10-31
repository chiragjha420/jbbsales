'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Receipt,
  Users,
  Package,
  Plus,
  BarChart3,
  UserCheck,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Shield,
  Layers,
  Settings,
} from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  // If on login page, render plain without navigation shell
  if (pathname === '/login') {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  // If loading authentication status or unauthenticated, display minimal spinner
  if (loading || !user) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="font-bold text-sm tracking-tight text-foreground">JBB SALES</div>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </main>
    );
  }

  const sidebarLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/sales', label: 'Sales', icon: Receipt },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { href: '/admin/analytics', label: 'Company Analytics', icon: BarChart3 },
    { href: '/admin/salespeople', label: 'Salespeople', icon: UserCheck },
    { href: '/admin/pricing', label: 'Pricing History', icon: TrendingUp },
    { href: '/admin/customers', label: 'Customer Portfolio', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-bold text-base tracking-tight">JBB SALES</div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              Jai Balaji Billiards
            </div>
          </div>
          {isAdmin && (
            <span className="text-[10px] bg-foreground text-background font-mono px-1.5 py-0.5 rounded uppercase font-semibold">
              Admin
            </span>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="p-3 border-b border-border">
          <Link
            href="/sales/new"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-primary text-primary-foreground hover:bg-primary-hover font-medium text-sm rounded transition-colors text-center"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 text-sm rounded transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase px-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  <span>Admin</span>
                </div>
              </div>
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 text-sm rounded transition-colors ${
                      isActive
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Identity Profile & Sign Out */}
        <div className="p-3 border-t border-border bg-surface text-xs flex items-center justify-between">
          <div className="truncate pr-2">
            <div className="font-semibold text-foreground truncate">{user?.full_name || 'User'}</div>
            <div className="text-muted-foreground text-[11px] truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-danger p-1.5 rounded transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight">JBB SALES</span>
          {isAdmin && (
            <span className="text-[9px] bg-foreground text-background font-mono px-1.5 py-0.2 rounded uppercase font-semibold">
              Admin
            </span>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 border border-border rounded text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile Extended Menu Modal (When Hamburger Pressed) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <div>
              <div className="font-bold text-base">JBB Sales</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 border border-border rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4">
            <div className="space-y-1">
              {sidebarLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-3 border-b border-border text-sm"
                >
                  <l.icon className="w-4 h-4" />
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>

            {isAdmin && (
              <div className="space-y-1 pt-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase px-2">Admin</div>
                {adminLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 border-b border-border text-sm"
                  >
                    <l.icon className="w-4 h-4" />
                    <span>{l.label}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <button
                onClick={logout}
                className="w-full py-2.5 border border-danger text-danger text-sm font-medium rounded flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 min-w-0 max-w-full overflow-y-auto">
        {children}
      </main>

      {/* Mobile Sticky Bottom Navigation: New Sale in the CENTER */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border flex items-center justify-between h-14 px-2">
        {/* Left 1: Home */}
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${
            pathname === '/dashboard' ? 'text-foreground font-semibold' : 'text-muted-foreground'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        {/* Left 2: Sales */}
        <Link
          href="/sales"
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${
            pathname.startsWith('/sales') && pathname !== '/sales/new' ? 'text-foreground font-semibold' : 'text-muted-foreground'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Sales</span>
        </Link>

        {/* Center: New Sale (Prominent action button) */}
        <Link
          href="/sales/new"
          className="flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-bold text-foreground"
        >
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center -mt-3 shadow-md">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="mt-0.5">New Sale</span>
        </Link>

        {/* Right 1: Customers */}
        <Link
          href="/customers"
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${
            pathname.startsWith('/customers') ? 'text-foreground font-semibold' : 'text-muted-foreground'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Customers</span>
        </Link>

        {/* Right 2: More */}
        <Link
          href="/settings"
          className={`flex-1 flex flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors ${
            pathname.startsWith('/settings') ? 'text-foreground font-semibold' : 'text-muted-foreground'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </Link>
      </nav>
    </div>
  );
}
