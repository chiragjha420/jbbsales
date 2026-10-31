'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Customer, Sale, Profile } from '@/types';
import { formatINR, formatDate } from '@/lib/calculations';
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  Receipt,
  PlusCircle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salespeople, setSalespeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Reassignment State (Admin only)
  const [reassignSalespersonId, setReassignSalespersonId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custRes, salesRes] = await Promise.all([
        fetch(`/api/customers/${params.id}`),
        fetch(`/api/sales?customerId=${params.id}`),
      ]);

      const custData = await custRes.json();
      const salesData = await salesRes.json();

      if (custData.customer) {
        setCustomer(custData.customer);
        setReassignSalespersonId(custData.customer.assigned_salesperson_id || '');
      }
      setSales(salesData.sales || []);

      if (isAdmin) {
        const spRes = await fetch('/api/admin/salespeople');
        const spData = await spRes.json();
        setSalespeople(spData.profiles?.filter((p: Profile) => p.role === 'salesperson' && p.active) || []);
      }
    } catch (err) {
      console.error('Failed to load customer detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignSalespersonId || reassignSalespersonId === customer?.assigned_salesperson_id) {
      return;
    }

    setReassigning(true);
    setReassignSuccess(false);
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignToSalespersonId: reassignSalespersonId }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        setReassignSuccess(true);
        setTimeout(() => setReassignSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to reassign customer.');
      }
    } catch {
      alert('Error during reassignment.');
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-surface animate-pulse rounded" />
        <div className="h-64 bg-surface animate-pulse rounded border border-border" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-base font-semibold">Customer not found.</div>
        <Link href="/customers" className="text-xs underline font-semibold">
          Return to Directory
        </Link>
      </div>
    );
  }

  // Calculate customer financials
  let totalRevenue = 0;
  let totalCost = 0;
  let totalPaid = 0;
  for (const s of sales) {
    totalRevenue += s.total_revenue;
    totalCost += s.total_cost;
    totalPaid += s.total_paid || 0;
  }
  const grossProfit = totalRevenue - totalCost;
  const outstanding = Math.max(0, totalRevenue - totalPaid);

  return (
    <div className="p-3.5 md:p-6 max-w-4xl mx-auto space-y-5 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Link
            href="/customers"
            className="p-1.5 border border-border rounded text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-base md:text-xl tracking-tight">{customer.name}</h1>
        </div>

        <Link
          href={`/sales/new`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Sale</span>
        </Link>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Revenue</div>
          <div className="text-base font-bold text-foreground mt-1">{formatINR(totalRevenue)}</div>
        </div>

        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Gross Profit</div>
          <div className="text-base font-bold text-success mt-1">{formatINR(grossProfit)}</div>
        </div>

        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Paid</div>
          <div className="text-base font-bold text-foreground mt-1">{formatINR(totalPaid)}</div>
        </div>

        <div className="p-3 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Outstanding</div>
          <div className="text-base font-bold text-danger mt-1">{formatINR(outstanding)}</div>
        </div>
      </div>

      {/* Customer Info & Ownership Reassignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-surface border border-border rounded space-y-2">
          <div className="font-semibold text-foreground uppercase tracking-wide text-[10px]">
            Details
          </div>
          <div className="space-y-1 divide-y divide-border/60">
            {customer.company && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Company:</span>
                <span className="font-medium text-foreground">{customer.company}</span>
              </div>
            )}
            {customer.contact_person && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Contact:</span>
                <span className="font-medium text-foreground">{customer.contact_person}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Phone:</span>
              <span className="font-medium text-foreground">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{customer.email}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">City:</span>
                <span className="font-medium text-foreground">{customer.city}</span>
              </div>
            )}
            {customer.address && (
              <div className="py-1">
                <span className="text-muted-foreground block">Address:</span>
                <span className="text-foreground">{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="py-1">
                <span className="text-muted-foreground block">Notes:</span>
                <span className="text-foreground">{customer.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ownership & Admin Reassignment */}
        <div className="p-3 bg-surface border border-border rounded space-y-2.5">
          <div className="font-semibold text-foreground uppercase tracking-wide text-[10px]">
            Assigned Salesperson
          </div>

          <div className="text-xs">
            <span className="text-muted-foreground">Salesperson: </span>
            <strong className="text-foreground font-semibold">
              {customer.assigned_salesperson?.full_name || 'Unassigned'}
            </strong>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-border space-y-2">
              <label className="text-[10px] text-muted-foreground uppercase font-medium block">
                Reassign Salesperson
              </label>
              <div className="flex gap-2">
                <select
                  value={reassignSalespersonId}
                  onChange={(e) => setReassignSalespersonId(e.target.value)}
                  className="flex-1 p-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
                >
                  <option value="">Select Salesperson...</option>
                  {salespeople.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.full_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={reassigning || reassignSalespersonId === customer.assigned_salesperson_id}
                  onClick={handleReassign}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded text-xs hover:bg-primary-hover disabled:opacity-40"
                >
                  {reassigning ? 'Saving...' : 'Reassign'}
                </button>
              </div>

              {reassignSuccess && (
                <div className="text-[11px] text-success font-medium">
                  Reassigned.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historical Sales Table for this customer */}
      <div className="space-y-3">
        <div className="font-semibold text-sm text-foreground uppercase tracking-wide">
          Sales & Order History ({sales.length})
        </div>

        {sales.length === 0 ? (
          <div className="p-6 border border-border rounded text-center bg-surface text-xs text-muted-foreground">
            No orders logged for this customer yet.
          </div>
        ) : (
          <div className="border border-border rounded overflow-hidden divide-y divide-border bg-card text-xs">
            {sales.map((s) => (
              <Link
                key={s.id}
                href={`/sales/${s.id}`}
                className="p-3.5 flex items-center justify-between hover:bg-surface transition-colors block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{s.sale_number}</span>
                    <span className="text-muted-foreground">{formatDate(s.sale_date)}</span>
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    Sold by: <strong className="text-foreground">{s.salesperson?.full_name}</strong> · {s.items?.length || 0} product(s)
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-foreground">{formatINR(s.total_revenue)}</div>
                  <div className="text-xs text-success font-medium">Profit: {formatINR(s.gross_profit)}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{s.payment_status.replace('_', ' ')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
