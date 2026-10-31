'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/calculations';
import { Search, Users, ChevronRight, ArrowUpDown } from 'lucide-react';

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
  const { isAdmin } = useAuth();
  const [data, setData] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof CustomerRow>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    loadCustomerAnalytics();
  }, []);

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

  return (
    <div className="p-3.5 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Customer Portfolio & Receivables</h1>
            <span className="text-[10px] bg-foreground text-background font-mono px-1.5 py-0.5 rounded font-bold uppercase">
              Admin
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Customer lifetime value, margins, receivables, and salesperson account distribution
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by customer, company, phone, or assigned salesperson..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 bg-surface animate-pulse rounded border border-border" />
      ) : (
        <div className="border border-border rounded overflow-hidden bg-card text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border select-none">
                <tr>
                  <th
                    className="p-3 cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('customerName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Customer & Entity</span>
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
                    onClick={() => toggleSort('paid')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Collected</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('outstanding')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Outstanding Due</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedData.map((row) => (
                  <tr key={row.customerId} className="hover:bg-surface/50 transition-colors">
                    <td className="p-3">
                      <Link
                        href={`/customers/${row.customerId}`}
                        className="font-bold text-foreground text-sm hover:underline block"
                      >
                        {row.customerName}
                      </Link>
                      <div className="text-[11px] text-muted-foreground">
                        {row.company ? `${row.company} · ` : ''}
                        {row.phone}
                      </div>
                    </td>

                    <td className="p-3 font-medium text-foreground">
                      {row.salespersonName}
                    </td>

                    <td className="p-3 text-right text-muted-foreground">{row.salesCount}</td>

                    <td className="p-3 text-right font-bold text-foreground text-sm">
                      {formatINR(row.revenue)}
                    </td>

                    <td className="p-3 text-right font-bold text-success text-sm">
                      {formatINR(row.profit)}
                    </td>

                    <td className="p-3 text-right font-medium text-foreground">
                      {formatINR(row.paid)}
                    </td>

                    <td className="p-3 text-right font-bold">
                      <span className={row.outstanding > 0 ? 'text-danger' : 'text-success'}>
                        {formatINR(row.outstanding)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
