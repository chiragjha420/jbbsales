'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Sale, PaymentStatus } from '@/types';
import { formatINR, formatDate } from '@/lib/calculations';
import {
  Search,
  Filter,
  PlusCircle,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';

export default function SalesHistoryPage() {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_revenue' | 'highest_profit'>('newest');

  useEffect(() => {
    loadSales();
  }, [paymentStatus, sortBy]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus);
      if (sortBy) params.set('sort', sortBy);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/sales?${params.toString()}`);
      const data = await res.json();
      setSales(data.sales || []);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSales();
  };

  const getStatusBadge = (status: PaymentStatus) => {
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
    <div className="p-3.5 md:p-6 max-w-5xl mx-auto space-y-4 pb-20">
      {/* Title & Action */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Sales</h1>

        <Link
          href="/sales/new"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Sale</span>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by sale #, customer, or salesperson..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-foreground"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface border border-border rounded px-2 py-1 text-xs shrink-0 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none w-full"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-surface border border-border rounded px-2 py-1 text-xs shrink-0 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-foreground focus:outline-none w-full"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest_revenue">Revenue</option>
              <option value="highest_profit">Profit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-surface animate-pulse rounded border border-border" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="p-8 border border-border rounded text-center bg-surface">
          <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <div className="text-sm font-semibold text-foreground">No sales found</div>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden divide-y divide-border bg-card">
          {sales.map((sale) => {
            const itemCount = sale.items?.length || 1;
            return (
              <Link
                key={sale.id}
                href={`/sales/${sale.id}`}
                className="p-3 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-foreground">
                      {sale.sale_number}
                    </span>
                    {getStatusBadge(sale.payment_status)}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(sale.sale_date, false)}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-foreground mt-1 truncate">
                    {sale.customer_name_snapshot}
                  </div>

                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    {isAdmin && sale.salesperson && (
                      <>
                        <span>•</span>
                        <span>{sale.salesperson.full_name}</span>
                      </>
                    )}
                  </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
