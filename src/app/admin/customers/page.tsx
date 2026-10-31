'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/calculations';
import { Search, ArrowUpDown } from 'lucide-react';

interface CustomerRow {
  customerId: string;
  customerName: string;
  company: string | null;
  phone: string;
  salespersonName: string;
  salesCount: number;
  revenue: number;
  profit: number;
  paid: number;
  outstanding: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof CustomerRow>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadCustomerAnalytics();
    }
  }, [isAdmin]);

  const loadCustomerAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/customers');
      const json = await res.json();
      setData(json.customers || []);
    } catch (err) {
      console.error('Failed to load customer analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let list = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.salespersonName.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return list;
  }, [data, search, sortField, sortAsc]);

  const toggleSort = (field: keyof CustomerRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
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
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Customer Portfolio</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by customer, company, salesperson..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Customer List: NO horizontal scroll on mobile */}
      {loading ? (
        <div className="h-64 bg-surface animate-pulse rounded border border-border" />
      ) : (
        <div className="border border-border rounded overflow-hidden bg-card text-xs">
          {/* Mobile View: Stacked Cards (100% width) */}
          <div className="divide-y divide-border block sm:hidden">
            {filteredAndSortedData.map((row) => (
              <div key={row.customerId} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/customers/${row.customerId}`}
                      className="font-bold text-sm text-foreground hover:underline"
                    >
                      {row.customerName}
                    </Link>
                    <div className="text-[11px] text-muted-foreground">
                      {row.company ? `${row.company} • ` : ''}{row.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">{formatINR(row.revenue)}</div>
                    <div className="text-[11px] text-success font-semibold">+{formatINR(row.profit)} profit</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div>Rep: <strong className="text-foreground">{row.salespersonName}</strong></div>
                  <div>Orders: <strong className="text-foreground">{row.salesCount}</strong></div>
                  <div>
                    Due:{' '}
                    <span className={row.outstanding > 0 ? 'text-danger font-semibold' : 'text-success'}>
                      {formatINR(row.outstanding)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View Table */}
          <table className="w-full text-left hidden sm:table">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border select-none">
              <tr>
                <th
                  className="p-3 cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('customerName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Customer</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('salespersonName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Salesperson</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('salesCount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Orders</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Revenue</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gross Profit</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('outstanding')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Outstanding</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedData.map((row) => (
                <tr key={row.customerId} className="hover:bg-surface/50">
                  <td className="p-3">
                    <Link
                      href={`/customers/${row.customerId}`}
                      className="font-semibold text-foreground text-sm hover:underline"
                    >
                      {row.customerName}
                    </Link>
                    <div className="text-[11px] text-muted-foreground">
                      {row.company ? `${row.company} · ` : ''}{row.phone}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-foreground">{row.salespersonName}</td>
                  <td className="p-3 text-right font-medium">{row.salesCount}</td>
                  <td className="p-3 text-right font-bold text-foreground">{formatINR(row.revenue)}</td>
                  <td className="p-3 text-right font-bold text-success">{formatINR(row.profit)}</td>
                  <td className="p-3 text-right font-semibold">
                    <span className={row.outstanding > 0 ? 'text-danger' : 'text-success'}>
                      {formatINR(row.outstanding)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
