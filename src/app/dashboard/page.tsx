'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sale, FinancialSummary } from '@/types';
import { formatINR, formatDate } from '@/lib/calculations';
import {
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
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
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData.summary || null);
        }
      } else {
        // Salesperson personal metrics strictly calculated from their own sales
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
    <div className="p-3.5 md:p-6 max-w-5xl mx-auto space-y-5 pb-20">
      {/* Top Banner & Quick Action */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          {isAdmin ? 'Dashboard' : 'Sales Desk'}
        </h1>

        <Link
          href="/sales/new"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors text-center"
        >
          <Plus className="w-4 h-4" />
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
              {r === 'all' ? 'All' : r === 'today' ? 'Today' : `This ${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface animate-pulse rounded border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 bg-surface border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase font-medium">Revenue</div>
            <div className="text-base md:text-lg font-bold mt-0.5 text-foreground">
              {formatINR(summary?.totalRevenue || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {summary?.salesCount || 0} {summary?.salesCount === 1 ? 'order' : 'orders'}
            </div>
          </div>

          <div className="p-3 bg-surface border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase font-medium">Gross Profit</div>
            <div className="text-base md:text-lg font-bold mt-0.5 text-success">
              {formatINR(summary?.totalGrossProfit || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Margin: <span className="font-semibold text-foreground">{(summary?.grossMargin || 0).toFixed(0)}%</span>
            </div>
          </div>

          <div className="p-3 bg-surface border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase font-medium">Received</div>
            <div className="text-base md:text-lg font-bold mt-0.5 text-foreground">
              {formatINR(summary?.totalPaymentsReceived || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Verified payments</div>
          </div>

          <div className="p-3 bg-surface border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase font-medium">Outstanding</div>
            <div className="text-base md:text-lg font-bold mt-0.5 text-danger">
              {formatINR(summary?.outstandingAmount || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Receivable</div>
          </div>
        </div>
      )}

      {/* Admin Shortcuts (Admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link
            href="/admin/salespeople"
            className="p-2.5 border border-border bg-card hover:bg-surface rounded transition-colors flex items-center justify-between"
          >
            <span className="font-semibold text-xs text-foreground">Salespeople Performance</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </Link>

          <Link
            href="/admin/pricing"
            className="p-2.5 border border-border bg-card hover:bg-surface rounded transition-colors flex items-center justify-between"
          >
            <span className="font-semibold text-xs text-foreground">Pricing History</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </Link>

          <Link
            href="/admin/analytics"
            className="p-2.5 border border-border bg-card hover:bg-surface rounded transition-colors flex items-center justify-between"
          >
            <span className="font-semibold text-xs text-foreground">Company Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </Link>
        </div>
      )}

      {/* Recent Sales Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-xs uppercase tracking-wide text-foreground">
            {isAdmin ? 'Recent Orders' : 'Recent Sales'}
          </div>
          <Link
            href="/sales"
            className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3 h-3" />
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
            <div className="text-sm font-medium text-foreground">No sales recorded</div>
          </div>
        ) : (
          <div className="border border-border rounded overflow-hidden divide-y divide-border bg-card">
            {recentSales.map((sale) => (
              <Link
                key={sale.id}
                href={`/sales/${sale.id}`}
                className="p-3 flex items-center justify-between gap-2.5 hover:bg-surface transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-xs text-foreground">
                      {sale.sale_number}
                    </span>
                    {getStatusBadge(sale.payment_status)}
                    <span className="text-[11px] text-muted-foreground">{formatDate(sale.sale_date, false)}</span>
                  </div>
                  <div className="font-medium text-sm text-foreground truncate mt-0.5">
                    {sale.customer_name_snapshot}
                  </div>
                  {isAdmin && sale.salesperson && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {sale.salesperson.full_name}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-foreground">
                    {formatINR(sale.total_revenue)}
                  </div>
                  <div className="text-xs text-success font-medium">
                    +{formatINR(sale.gross_profit)}
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
