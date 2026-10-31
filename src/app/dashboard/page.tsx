'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sale, FinancialSummary } from '@/types';
import { formatINR, formatDate } from '@/lib/calculations';
import {
  PlusCircle,
  TrendingUp,
  Receipt,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    if (authLoading) return;
    loadDashboardData();
  }, [authLoading, user, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Calculate date filters
      let startDate: string | undefined;
      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = start.toISOString();
      } else if (dateRange === 'week') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = start.toISOString();
      } else if (dateRange === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = start.toISOString();
      } else if (dateRange === 'year') {
        const start = new Date(now.getFullYear(), 0, 1);
        startDate = start.toISOString();
      }

      // Fetch sales (server applies salesperson restriction if not admin)
      const salesRes = await fetch(
        `/api/sales?sort=newest${startDate ? `&startDate=${startDate}` : ''}`
      );
      const salesData = await salesRes.json();
      const salesList: Sale[] = salesData.sales || [];
      setRecentSales(salesList.slice(0, 8));

      // Calculate or fetch summary
      if (isAdmin) {
        const sumRes = await fetch(
          `/api/analytics/summary${startDate ? `?startDate=${startDate}` : ''}`
        );
        const sumData = await sumRes.json();
        setSummary(sumData.summary || null);
      } else {
        // Salesperson personal metrics
        let totalRev = 0;
        let totalCost = 0;
        let totalPaid = 0;
        for (const s of salesList) {
          totalRev += s.total_revenue;
          totalCost += s.total_cost;
          totalPaid += s.total_paid || 0;
        }
        const grossProfit = totalRev - totalCost;
        const grossMargin = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;
        setSummary({
          totalRevenue: totalRev,
          totalCost,
          totalGrossProfit: grossProfit,
          grossMargin,
          salesCount: salesList.length,
          customerCount: 0,
          totalPaymentsReceived: totalPaid,
          outstandingAmount: Math.max(0, totalRev - totalPaid),
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-success-surface text-success font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-warning-surface text-warning font-medium">
            <Clock className="w-3 h-3" />
            <span>Partially Paid</span>
          </span>
        );
      case 'overpaid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted text-foreground font-medium">
            <span>Overpaid</span>
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-danger-surface text-danger font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Unpaid</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            {isAdmin ? 'Management Executive Overview' : `Sales Desk: ${user?.full_name || 'Rahul Sharma'}`}
          </h1>
          <div className="text-xs text-muted-foreground mt-0.5">
            {isAdmin
              ? 'Real-time company performance, profitability and cash collection metrics'
              : 'Direct sales logging, negotiated pricing economics and payment proofs'}
          </div>
        </div>

        {/* The most prominent action on Home must be New Sale */}
        <Link
          href="/sales/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-sm rounded shadow-sm transition-colors text-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Sale</span>
        </Link>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          <span>Period:</span>
        </div>
        <div className="inline-flex rounded border border-border bg-surface p-0.5">
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

      {/* Financial Metrics Row - Clean, Information-Dense Business Layout */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-surface animate-pulse rounded border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-surface border border-border rounded">
            <div className="text-[11px] text-muted-foreground uppercase font-medium">Total Revenue</div>
            <div className="text-lg md:text-xl font-bold mt-1 text-foreground">
              {formatINR(summary?.totalRevenue || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {summary?.salesCount || 0} orders recorded
            </div>
          </div>

          <div className="p-3.5 bg-surface border border-border rounded">
            <div className="text-[11px] text-muted-foreground uppercase font-medium">Gross Profit</div>
            <div className="text-lg md:text-xl font-bold mt-1 text-success">
              {formatINR(summary?.totalGrossProfit || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Margin: <span className="font-semibold text-foreground">{(summary?.grossMargin || 0).toFixed(1)}%</span>
            </div>
          </div>

          <div className="p-3.5 bg-surface border border-border rounded">
            <div className="text-[11px] text-muted-foreground uppercase font-medium">Payments Received</div>
            <div className="text-lg md:text-xl font-bold mt-1 text-foreground">
              {formatINR(summary?.totalPaymentsReceived || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Verified payment entries</div>
          </div>

          <div className="p-3.5 bg-surface border border-border rounded">
            <div className="text-[11px] text-muted-foreground uppercase font-medium">Outstanding Balance</div>
            <div className="text-lg md:text-xl font-bold mt-1 text-danger">
              {formatINR(summary?.outstandingAmount || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Uncollected receivables</div>
          </div>
        </div>
      )}

      {/* Admin Intelligence Shortcuts */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <Link
            href="/admin/salespeople"
            className="p-3 border border-border bg-card hover:bg-surface rounded transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-sm text-foreground">Salespeople Margins</div>
              <div className="text-xs text-muted-foreground">Compare revenue, profit and discounting by salesperson</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          <Link
            href="/admin/pricing"
            className="p-3 border border-border bg-card hover:bg-surface rounded transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-sm text-foreground">Actual Pricing History</div>
              <div className="text-xs text-muted-foreground">Product costs vs negotiated selling prices</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>

          <Link
            href="/admin/analytics"
            className="p-3 border border-border bg-card hover:bg-surface rounded transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-semibold text-sm text-foreground">Full Analytics</div>
              <div className="text-xs text-muted-foreground">Company-wide breakdown and audit trail</div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        </div>
      )}

      {/* Recent Sales Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-foreground">
              {isAdmin ? 'Recent Company Orders' : 'Your Recent Sales'}
            </h2>
          </div>
          <Link
            href="/sales"
            className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
          >
            <span>View All Sales</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface animate-pulse rounded border border-border" />
            ))}
          </div>
        ) : recentSales.length === 0 ? (
          <div className="p-8 border border-border rounded text-center bg-surface">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <div className="text-sm font-medium text-foreground">No sales recorded yet.</div>
            <div className="text-xs text-muted-foreground mt-1 mb-4">
              Log negotiated sales with customer details and payment proof.
            </div>
            <Link
              href="/sales/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record First Sale</span>
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded overflow-hidden divide-y divide-border bg-card">
            {recentSales.map((sale) => (
              <Link
                key={sale.id}
                href={`/sales/${sale.id}`}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-surface transition-colors block"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs text-foreground">
                      {sale.sale_number}
                    </span>
                    {getStatusBadge(sale.payment_status)}
                  </div>
                  <div className="font-medium text-sm text-foreground truncate mt-1">
                    {sale.customer_name_snapshot}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>{formatDate(sale.sale_date)}</span>
                    {isAdmin && sale.salesperson && (
                      <span>Rep: <strong className="font-medium text-foreground">{sale.salesperson.full_name}</strong></span>
                    )}
                    <span>{sale.items?.length || 0} product(s)</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                  <div className="font-bold text-sm text-foreground">
                    {formatINR(sale.total_revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Profit: <span className="text-success font-medium">{formatINR(sale.gross_profit)}</span>
                    <span className="ml-1 text-[11px]">({sale.gross_margin.toFixed(0)}%)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
