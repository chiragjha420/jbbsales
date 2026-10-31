'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FinancialSummary } from '@/types';
import { formatINR } from '@/lib/calculations';
import {
  BarChart3,
  Filter,
  ArrowUpRight,
  Shield,
  Layers,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

export default function AdminCompanyAnalyticsPage() {
  const { isAdmin } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [salespeople, setSalespeople] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

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

  return (
    <div className="p-3.5 md:p-6 max-w-6xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Executive Financial Analytics</h1>
            <span className="text-[10px] bg-foreground text-background font-mono px-1.5 py-0.5 rounded font-bold uppercase">
              Admin
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Verified company profit, cash inflow, salesperson margin performance and receivables
          </div>
        </div>

        {/* Date Filter */}
        <div className="inline-flex rounded border border-border bg-surface p-0.5 text-xs self-start sm:self-auto">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-2.5 py-1 text-xs rounded transition-colors capitalize ${
                dateRange === r
                  ? 'bg-background text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'all' ? 'All Time' : r === 'today' ? 'Today' : `This ${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Company Revenue</div>
          <div className="text-xl font-bold text-foreground mt-1">
            {formatINR(summary?.totalRevenue || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {summary?.salesCount || 0} executed sale contracts
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Gross Profit</div>
          <div className="text-xl font-bold text-success mt-1">
            {formatINR(summary?.totalGrossProfit || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Company Margin: <strong className="text-foreground">{(summary?.grossMargin || 0).toFixed(1)}%</strong>
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Payments Collected</div>
          <div className="text-xl font-bold text-foreground mt-1">
            {formatINR(summary?.totalPaymentsReceived || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Bank / UPI / Cash verified</div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Outstanding Due</div>
          <div className="text-xl font-bold text-danger mt-1">
            {formatINR(summary?.outstandingAmount || 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Unpaid order receivables</div>
        </div>
      </div>

      {/* Salesperson Contribution Table */}
      <div className="border border-border rounded overflow-hidden bg-card text-xs">
        <div className="p-3 bg-surface border-b border-border flex justify-between items-center">
          <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
            Representative Revenue & Gross Profit Breakdown
          </div>
          <Link href="/admin/salespeople" className="text-xs font-semibold underline text-foreground">
            Full Table
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
      </div>

      {/* Product Profitability Highlights */}
      <div className="border border-border rounded overflow-hidden bg-card text-xs">
        <div className="p-3 bg-surface border-b border-border flex justify-between items-center">
          <div className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
            Product Catalog Economics & Margin Review
          </div>
          <Link href="/admin/pricing" className="text-xs font-semibold underline text-foreground">
            Pricing History
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Avg Sold Price</th>
                <th className="p-3 text-right">Total Profit</th>
                <th className="p-3 text-right">Margin %</th>
                <th className="p-3 text-right">Units Sold</th>
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
    </div>
  );
}
