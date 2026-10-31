'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FinancialSummary } from '@/types';
import { formatINR } from '@/lib/calculations';

export default function AdminCompanyAnalyticsPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [salespeople, setSalespeople] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [dateRange, isAdmin]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      const now = new Date();
      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      } else if (dateRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      }

      const [sumRes, spRes, prodRes] = await Promise.all([
        fetch(`/api/analytics/summary${startDate ? `?startDate=${startDate}` : ''}`),
        fetch(`/api/analytics/salespeople${startDate ? `?startDate=${startDate}` : ''}`),
        fetch(`/api/analytics/pricing`),
      ]);

      const sumData = await sumRes.json();
      const spData = await spRes.json();
      const prodData = await prodRes.json();

      setSummary(sumData.summary || null);
      setSalespeople(spData.salespeople || []);
      setProducts(prodData.products || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Access restricted.
      </div>
    );
  }

  return (
    <div className="p-3.5 md:p-6 max-w-5xl mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Company Analytics</h1>

        {/* Date Filter */}
        <div className="inline-flex rounded border border-border bg-surface p-0.5 text-xs">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                dateRange === r
                  ? 'bg-background text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'all' ? 'All' : r === 'today' ? 'Today' : `This ${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Revenue</div>
          <div className="text-base md:text-lg font-bold text-foreground mt-0.5">
            {formatINR(summary?.totalRevenue || 0)}
          </div>
        </div>

        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Gross Profit</div>
          <div className="text-base md:text-lg font-bold text-success mt-0.5">
            {formatINR(summary?.totalGrossProfit || 0)}
          </div>
        </div>

        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Margin</div>
          <div className="text-base md:text-lg font-bold text-foreground mt-0.5">
            {(summary?.grossMargin || 0).toFixed(1)}%
          </div>
        </div>

        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Outstanding</div>
          <div className="text-base md:text-lg font-bold text-danger mt-0.5">
            {formatINR(summary?.outstandingAmount || 0)}
          </div>
        </div>
      </div>

      {/* Salesperson Breakdown: ZERO horizontal scroll */}
      <div className="border border-border rounded overflow-hidden bg-card text-xs">
        <div className="p-3 bg-surface border-b border-border flex justify-between items-center">
          <div className="font-semibold uppercase tracking-wider text-foreground text-xs">
            Salespeople
          </div>
          <Link href="/admin/salespeople" className="text-xs font-semibold text-primary hover:underline">
            View All
          </Link>
        </div>

        {/* Mobile View: Clean Stacked Cards */}
        <div className="divide-y divide-border block sm:hidden">
          {salespeople.map((sp) => (
            <div key={sp.salespersonId} className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{sp.salespersonName}</span>
                <span className="font-bold text-foreground">{formatINR(sp.revenue)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Profit: <strong className="text-success">{formatINR(sp.profit)}</strong> ({sp.margin.toFixed(0)}%)</span>
                <span>{sp.salesCount} orders • {sp.customerCount} customers</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View Table */}
        <table className="w-full text-left hidden sm:table">
          <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border">
            <tr>
              <th className="p-3">Salesperson</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">Gross Profit</th>
              <th className="p-3 text-right">Margin %</th>
              <th className="p-3 text-right">Orders</th>
              <th className="p-3 text-right">Customers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {salespeople.map((sp) => (
              <tr key={sp.salespersonId} className="hover:bg-surface/50">
                <td className="p-3 font-semibold text-foreground">{sp.salespersonName}</td>
                <td className="p-3 text-right font-bold text-foreground">{formatINR(sp.revenue)}</td>
                <td className="p-3 text-right font-bold text-success">{formatINR(sp.profit)}</td>
                <td className="p-3 text-right font-medium">{sp.margin.toFixed(1)}%</td>
                <td className="p-3 text-right text-muted-foreground">{sp.salesCount}</td>
                <td className="p-3 text-right text-muted-foreground">{sp.customerCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Profitability */}
      <div className="border border-border rounded overflow-hidden bg-card text-xs">
        <div className="p-3 bg-surface border-b border-border flex justify-between items-center">
          <div className="font-semibold uppercase tracking-wider text-foreground text-xs">
            Product Margins
          </div>
          <Link href="/admin/pricing" className="text-xs font-semibold text-primary hover:underline">
            Pricing History
          </Link>
        </div>

        {/* Mobile View: Stacked Cards */}
        <div className="divide-y divide-border block sm:hidden">
          {products.slice(0, 6).map((p) => (
            <div key={p.productId} className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-foreground">{p.productName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{p.sku}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">{p.timesSold > 0 ? formatINR(p.avgSellingPrice) : '-'}</div>
                  <div className="text-[11px] text-success font-semibold">
                    {p.timesSold > 0 ? `+${formatINR(p.totalProfit)}` : '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <span>Cost: {formatINR(p.currentCost)}</span>
                <span>Margin: {p.timesSold > 0 ? `${p.avgMargin.toFixed(0)}%` : '-'} • Units: {p.totalQuantity}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View Table */}
        <table className="w-full text-left hidden sm:table">
          <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Cost</th>
              <th className="p-3 text-right">Avg Sold</th>
              <th className="p-3 text-right">Profit</th>
              <th className="p-3 text-right">Margin %</th>
              <th className="p-3 text-right">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.slice(0, 6).map((p) => (
              <tr key={p.productId} className="hover:bg-surface/50">
                <td className="p-3">
                  <div className="font-semibold text-foreground">{p.productName}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{p.sku}</div>
                </td>
                <td className="p-3 text-right font-mono">{formatINR(p.currentCost)}</td>
                <td className="p-3 text-right font-bold text-foreground">
                  {p.timesSold > 0 ? formatINR(p.avgSellingPrice) : '-'}
                </td>
                <td className="p-3 text-right font-bold text-success">
                  {p.timesSold > 0 ? formatINR(p.totalProfit) : '-'}
                </td>
                <td className="p-3 text-right font-medium">
                  {p.timesSold > 0 ? `${p.avgMargin.toFixed(1)}%` : '-'}
                </td>
                <td className="p-3 text-right font-semibold text-foreground">{p.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
