'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/calculations';
import { TrendingUp, Filter, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

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
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ProductPricingRow[]>([]);
  const [salespeople, setSalespeople] = useState<Array<{ id: string; full_name: string }>>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load salespeople for filter
    fetch('/api/admin/salespeople')
      .then((r) => r.json())
      .then((d) => setSalespeople(d.profiles?.filter((p: any) => p.role === 'salesperson') || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadPricingData();
  }, [selectedSalespersonId]);

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

  return (
    <div className="p-3.5 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Product Pricing & Discounting Audit</h1>
            <span className="text-[10px] bg-foreground text-background font-mono px-1.5 py-0.5 rounded font-bold uppercase">
              Admin
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Identify discounting patterns, negotiated selling ranges, and margin erosion by representative
          </div>
        </div>

        {/* Filter by salesperson */}
        <div className="flex items-center gap-2 bg-surface border border-border rounded p-1.5 text-xs self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          <span className="text-muted-foreground">Filter by Rep:</span>
          <select
            value={selectedSalespersonId}
            onChange={(e) => setSelectedSalespersonId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-foreground focus:outline-none pr-1"
          >
            <option value="">All Salespeople Combined</option>
            {salespeople.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing Analysis Table */}
      {loading ? (
        <div className="h-64 bg-surface animate-pulse rounded border border-border" />
      ) : (
        <div className="border border-border rounded overflow-hidden bg-card text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="p-3">Product Name & SKU</th>
                  <th className="p-3 text-right">Current Cost</th>
                  <th className="p-3 text-right">Recommended</th>
                  <th className="p-3 text-right">Lowest Sold</th>
                  <th className="p-3 text-right">Avg Sold</th>
                  <th className="p-3 text-right">Highest Sold</th>
                  <th className="p-3 text-right">Avg Realized Margin</th>
                  <th className="p-3 text-right">Times Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => {
                  const hasDiscounts =
                    row.timesSold > 0 &&
                    row.minimumPrice !== null &&
                    row.minSellingPrice < row.minimumPrice;

                  return (
                    <tr key={row.productId} className="hover:bg-surface/60 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          <span>{row.productName}</span>
                          {hasDiscounts && (
                            <span title="Sold below minimum price threshold" className="text-warning">
                              <AlertTriangle className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {row.sku} · {row.category}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-medium text-foreground">
                        {formatINR(row.currentCost)}
                      </td>

                      <td className="p-3 text-right text-muted-foreground font-mono">
                        {row.recommendedPrice ? formatINR(row.recommendedPrice) : '-'}
                      </td>

                      <td className="p-3 text-right font-medium text-foreground">
                        {row.timesSold > 0 ? (
                          <span
                            className={
                              row.minimumPrice && row.minSellingPrice < row.minimumPrice
                                ? 'text-warning font-bold'
                                : ''
                            }
                          >
                            {formatINR(row.minSellingPrice)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-3 text-right font-bold text-foreground text-sm">
                        {row.timesSold > 0 ? formatINR(row.avgSellingPrice) : '-'}
                      </td>

                      <td className="p-3 text-right font-medium text-foreground">
                        {row.timesSold > 0 ? formatINR(row.maxSellingPrice) : '-'}
                      </td>

                      <td className="p-3 text-right font-semibold">
                        {row.timesSold > 0 ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              row.avgMargin >= 25
                                ? 'bg-success-surface text-success'
                                : row.avgMargin >= 15
                                ? 'bg-warning-surface text-warning'
                                : 'bg-danger-surface text-danger'
                            }`}
                          >
                            {row.avgMargin.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="p-3 text-right font-bold text-foreground">
                        {row.timesSold}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
