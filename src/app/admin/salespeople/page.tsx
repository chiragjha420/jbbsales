'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/calculations';
import {
  UserPlus,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface SalespersonRow {
  salespersonId: string;
  salespersonName: string;
  email: string;
  revenue: number;
  profit: number;
  margin: number;
  salesCount: number;
  quantitySold: number;
  customerCount: number;
  avgSaleValue: number;
  avgProfitPerSale: number;
}

export default function AdminSalespeoplePage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState<SalespersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof SalespersonRow>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  // New Salesperson Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      loadSalespeopleData();
    }
  }, [isAdmin]);

  const loadSalespeopleData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/salespeople');
      const json = await res.json();
      setData(json.salespeople || []);
    } catch (err) {
      console.error('Failed to load salespeople:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortAsc
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data, sortField, sortAsc]);

  const toggleSort = (field: keyof SalespersonRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleCreateSalesperson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      alert('Name and email are required.');
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch('/api/admin/salespeople', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim() || undefined,
          role: 'salesperson',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to create salesperson.');
      } else {
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        loadSalespeopleData();
      }
    } catch {
      alert('Network error while creating salesperson.');
    } finally {
      setSavingUser(false);
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
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Salespeople</h1>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Salesperson</span>
        </button>
      </div>

      {/* Comparison List: NO horizontal scroll on mobile */}
      {loading ? (
        <div className="h-64 bg-surface animate-pulse rounded border border-border" />
      ) : (
        <div className="border border-border rounded overflow-hidden bg-card text-xs">
          {/* Mobile View: Stacked Cards (100% width) */}
          <div className="divide-y divide-border block sm:hidden">
            {sortedData.map((row) => (
              <div key={row.salespersonId} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-foreground">{row.salespersonName}</div>
                    <div className="text-[11px] text-muted-foreground">{row.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">{formatINR(row.revenue)}</div>
                    <div className="text-[11px] text-success font-semibold">+{formatINR(row.profit)} ({row.margin.toFixed(0)}%)</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div>Orders: <strong className="text-foreground">{row.salesCount}</strong></div>
                  <div>Customers: <strong className="text-foreground">{row.customerCount}</strong></div>
                  <div>Avg: <strong className="text-foreground">{formatINR(row.avgSaleValue)}</strong></div>
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
                  onClick={() => toggleSort('salespersonName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Salesperson</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Revenue</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Profit</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('margin')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Margin %</span>
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
                  onClick={() => toggleSort('customerCount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Customers</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="p-3 text-right cursor-pointer hover:text-foreground"
                  onClick={() => toggleSort('avgSaleValue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Avg Order</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedData.map((row) => (
                <tr key={row.salespersonId} className="hover:bg-surface/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-foreground text-sm">{row.salespersonName}</div>
                    <div className="text-[11px] text-muted-foreground">{row.email}</div>
                  </td>
                  <td className="p-3 text-right font-bold text-foreground text-sm">
                    {formatINR(row.revenue)}
                  </td>
                  <td className="p-3 text-right font-bold text-success text-sm">
                    {formatINR(row.profit)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {row.margin.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-medium">{row.salesCount}</td>
                  <td className="p-3 text-right font-medium">{row.customerCount}</td>
                  <td className="p-3 text-right text-muted-foreground font-mono">
                    {formatINR(row.avgSaleValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Salesperson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div className="font-bold text-sm">Add Salesperson</div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSalesperson} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@jbb.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-border rounded text-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
                >
                  {savingUser ? 'Saving...' : 'Add Salesperson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
