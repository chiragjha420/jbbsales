'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/calculations';
import {
  UserCheck,
  UserPlus,
  ArrowUpDown,
  Shield,
  Filter,
  Check,
  X,
  AlertCircle,
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
  const { isAdmin } = useAuth();
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
    loadSalespeopleData();
  }, []);

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
      setSortAsc(false); // Default descending for financial metrics
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
      if (res.ok) {
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        loadSalespeopleData();
      } else {
        alert(json.error || 'Failed to add salesperson.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="p-3.5 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Salespeople Economics</h1>
            <span className="text-[10px] bg-foreground text-background font-mono px-1.5 py-0.5 rounded font-bold uppercase">
              Admin
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Compare representative revenue, gross profit contribution, realized margin and discounting
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Salesperson</span>
        </button>
      </div>

      {/* Comparison Table */}
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
                      <span>Gross Profit</span>
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
                  <th
                    className="p-3 text-right cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('avgProfitPerSale')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Avg Profit</span>
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
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          row.margin >= 25
                            ? 'bg-success-surface text-success'
                            : row.margin >= 15
                            ? 'bg-warning-surface text-warning'
                            : 'bg-danger-surface text-danger'
                        }`}
                      >
                        {row.margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">{row.salesCount}</td>
                    <td className="p-3 text-right font-medium">{row.customerCount}</td>
                    <td className="p-3 text-right text-muted-foreground font-mono">
                      {formatINR(row.avgSaleValue)}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {formatINR(row.avgProfitPerSale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Salesperson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div className="font-bold text-sm">Add Sales Representative</div>
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
                  Full Name <span className="text-danger">*</span>
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
                  Work Email <span className="text-danger">*</span>
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
