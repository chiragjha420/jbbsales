'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Product, Sale } from '@/types';
import { formatINR, formatDate } from '@/lib/calculations';
import {
  ArrowLeft,
  Package,
  Edit,
  Check,
  AlertTriangle,
  Upload,
  Receipt,
  X,
  Star,
  Trash2,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [salesWithProduct, setSalesWithProduct] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editRec, setEditRec] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, salesRes] = await Promise.all([
        fetch(`/api/products/${params.id}`),
        fetch(`/api/sales?productId=${params.id}`),
      ]);

      const prodData = await prodRes.json();
      const salesData = await salesRes.json();

      if (prodData.product) {
        setProduct(prodData.product);
        setEditName(prodData.product.name);
        setEditCost(prodData.product.cost_price.toString());
        setEditRec(prodData.product.recommended_price?.toString() || '');
        setEditMin(prodData.product.minimum_price?.toString() || '');
        setEditCategory(prodData.product.category);
      }
      setSalesWithProduct(salesData.sales || []);
    } catch (err) {
      console.error('Failed to load product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || isNaN(parseFloat(editCost))) {
      alert('Valid product name and cost are required.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          cost_price: parseFloat(editCost),
          recommended_price: editRec ? parseFloat(editRec) : null,
          minimum_price: editMin ? parseFloat(editMin) : null,
          category: editCategory,
        }),
      });

      const data = await res.json();
      if (res.ok && data.product) {
        setProduct(data.product);
        setIsEditing(false);
      } else {
        alert(data.error || 'Failed to update product.');
      }
    } catch {
      alert('Network error while updating product.');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleProductActive = async () => {
    if (!product) return;
    const newStatus = !product.active;
    const confirmMsg = newStatus
      ? 'Reactivate this product for new sales?'
      : 'Deactivate this product? Existing historical sales will remain completely intact.';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProduct(data.product);
      }
    } catch {
      alert('Error changing product status.');
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

  if (!product) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-base font-semibold">Product not found.</div>
        <Link href="/products" className="text-xs underline font-semibold">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3.5 md:p-6 max-w-4xl mx-auto space-y-5 pb-24">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Link
            href="/products"
            className="p-1.5 border border-border rounded text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base md:text-lg">{product.name}</span>
              {product.active ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-success-surface text-success uppercase">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger-surface text-danger uppercase">
                  Deactivated
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              SKU: {product.sku} · Category: {product.category}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={toggleProductActive}
              className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                product.active
                  ? 'border-danger/30 text-danger hover:bg-danger-surface'
                  : 'border-success/30 text-success hover:bg-success-surface'
              }`}
            >
              {product.active ? 'Deactivate' : 'Reactivate'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border hover:bg-muted text-xs font-semibold rounded text-foreground transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Economics'}</span>
          </button>
        </div>
      </div>

      {/* Edit Form (if editing) */}
      {isEditing && (
        <div className="p-4 bg-surface border border-border rounded space-y-3 text-xs">
          <div className="font-semibold text-foreground uppercase tracking-wide text-[11px]">
            Edit Product Values
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
              >
                <option value="Tables">Tables</option>
                <option value="Cues">Cues</option>
                <option value="Accessories">Accessories</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Current Cost Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground font-bold focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Note: Changing cost does NOT alter past sales
              </span>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Recommended Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editRec}
                onChange={(e) => setEditRec(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Minimum Selling Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 border border-border rounded text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingEdit}
              onClick={handleSaveEdit}
              className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Update Product'}
            </button>
          </div>
        </div>
      )}

      {/* Economics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Current Cost Price</div>
          <div className="text-lg font-bold text-foreground mt-1">{formatINR(product.cost_price)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Base procurement cost</div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Recommended Price</div>
          <div className="text-lg font-bold text-foreground mt-1">
            {product.recommended_price ? formatINR(product.recommended_price) : '-'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {product.recommended_price
              ? `Est. Margin: ${(((product.recommended_price - product.cost_price) / product.recommended_price) * 100).toFixed(0)}%`
              : 'Open negotiation'}
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Floor / Minimum Price</div>
          <div className="text-lg font-bold text-foreground mt-1">
            {product.minimum_price ? formatINR(product.minimum_price) : 'No floor set'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Warning threshold</div>
        </div>

        <div className="p-3.5 bg-surface border border-border rounded">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Times Sold</div>
          <div className="text-lg font-bold text-foreground mt-1">{salesWithProduct.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Historical order occurrences</div>
        </div>
      </div>

      {/* Product Photos Gallery */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-3">
        <div className="font-semibold uppercase text-muted-foreground tracking-wide text-[11px]">
          Product Photo Catalog ({product.images?.length || 0})
        </div>

        {(!product.images || product.images.length === 0) ? (
          <div className="p-4 border border-dashed border-border rounded text-center text-xs text-muted-foreground">
            No photos uploaded for this product.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="relative aspect-square border border-border rounded overflow-hidden group bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.storage_path} alt={img.file_name} className="w-full h-full object-cover" />
                {img.is_primary && (
                  <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keywords */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-2">
        <div className="font-semibold uppercase text-muted-foreground tracking-wide text-[11px]">
          Configured Discovery Keywords
        </div>
        <div className="flex flex-wrap gap-1.5">
          {product.keywords?.map((kw, i) => (
            <span key={i} className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground">
              #{kw}
            </span>
          ))}
        </div>
      </div>

      {/* Actual Selling Price History for This Product */}
      <div className="space-y-3">
        <div className="font-semibold text-sm text-foreground uppercase tracking-wide">
          Actual Selling Price & Negotiation History
        </div>

        {salesWithProduct.length === 0 ? (
          <div className="p-6 border border-border rounded text-center bg-surface text-xs text-muted-foreground">
            No sales have been logged for this product yet.
          </div>
        ) : (
          <div className="border border-border rounded overflow-hidden divide-y divide-border bg-card text-xs">
            {salesWithProduct.map((s) => {
              const matchedItem = s.items?.find((i) => i.product_id === product.id);
              return (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-surface transition-colors">
                  <div>
                    <div className="font-mono font-bold text-foreground">
                      <Link href={`/sales/${s.id}`} className="hover:underline">
                        {s.sale_number}
                      </Link>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      Customer: <strong className="text-foreground">{s.customer_name_snapshot}</strong> · Rep: {s.salesperson?.full_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Sold on {formatDate(s.sale_date)} · Qty: {matchedItem?.quantity || 1}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-foreground">
                      Sold at: {formatINR(matchedItem?.selling_price || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cost snapshot: <span className="font-mono">{formatINR(matchedItem?.cost_at_sale || 0)}</span>
                    </div>
                    <div className="text-xs font-semibold text-success">
                      Profit: {formatINR(matchedItem?.line_profit || 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
