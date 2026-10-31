'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/calculations';
import { Filter } from 'lucide-react';

interface ProductPricingRow {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentCost: number;
  recommendedPrice: number | null;
  minimumPrice: number | null;
  timesSold: number;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  avgSellingPrice: number;
  minSellingPrice: number;
  maxSellingPrice: number;
  avgMargin: number;
}

export default function AdminPricingAnalyticsPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState<ProductPricingRow[]>([]);
  const [salespeople, setSalespeople] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/admin/salespeople')
        .then((r) => r.json())
        .then((d) => setSalespeople(d.profiles?.filter((p: any) => p.role === 'salesperson') || []))
        .catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadPricingData();
    }
  }, [selectedSalespersonId, isAdmin]);

  const loadPricingData = async () => {
    setLoading(true);
    try {
      const url = selectedSalespersonId
        ? `/api/analytics/pricing?salespersonId=${selectedSalespersonId}`
        : '/api/analytics/pricing';
      const res = await fetch(url);
      const json = await res.json();
      setData(json.products || []);
    } catch (err) {
      console.error('Failed to load pricing data:', err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Pricing History</h1>

        {/* Filter by salesperson */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded px-2.5 py-1 text-xs self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={selectedSalespersonId}
            onChange={(e) => setSelectedSalespersonId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="">All Salespeople</option>
            {salespeople.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing List: NO horizontal scroll on mobile */}
      {loading ? (
        <div className="h-64 bg-surface animate-pulse rounded border border-border" />
      ) : (
        <div className="border border-border rounded overflow-hidden bg-card text-xs">
          {/* Mobile View: Stacked Cards (100% width) */}
          <div className="divide-y divide-border block sm:hidden">
            {data.map((row) => (
              <div key={row.productId} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{row.productName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{row.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-foreground">
                      {row.timesSold > 0 ? formatINR(row.avgSellingPrice) : '-'}
                    </div>
                    <div className="text-[11px] text-success font-semibold">
                      {row.timesSold > 0 ? `+${formatINR(row.totalProfit)}` : '-'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div>Cost: <span className="font-mono text-foreground">{formatINR(row.currentCost)}</span></div>
                  <div>Range: {row.timesSold > 0 ? `${formatINR(row.minSellingPrice)} - ${formatINR(row.maxSellingPrice)}` : '-'}</div>
                  <div>Margin: <strong className="text-foreground">{row.timesSold > 0 ? `${row.avgMargin.toFixed(0)}%` : '-'}</strong></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View Table */}
          <table className="w-full text-left hidden sm:table">
            <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border select-none">
              <tr>
                <th className="p-3">Product Name & SKU</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Avg Selling</th>
                <th className="p-3 text-right">Range (Min - Max)</th>
                <th className="p-3 text-right">Units Sold</th>
                <th className="p-3 text-right">Total Profit</th>
                <th className="p-3 text-right">Avg Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr key={row.productId} className="hover:bg-surface/50">
                  <td className="p-3">
                    <div className="font-semibold text-foreground text-sm">{row.productName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{row.sku}</div>
                  </td>
                  <td className="p-3 text-right font-mono">{formatINR(row.currentCost)}</td>
                  <td className="p-3 text-right font-bold text-foreground">
                    {row.timesSold > 0 ? formatINR(row.avgSellingPrice) : '-'}
                  </td>
                  <td className="p-3 text-right text-muted-foreground font-mono text-[11px]">
                    {row.timesSold > 0
                      ? `${formatINR(row.minSellingPrice)} - ${formatINR(row.maxSellingPrice)}`
                      : '-'}
                  </td>
                  <td className="p-3 text-right font-semibold text-foreground">{row.totalQuantity}</td>
                  <td className="p-3 text-right font-bold text-success">
                    {row.timesSold > 0 ? formatINR(row.totalProfit) : '-'}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {row.timesSold > 0 ? `${row.avgMargin.toFixed(1)}%` : '-'}
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
