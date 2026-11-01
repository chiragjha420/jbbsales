'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types';
import { formatINR } from '@/lib/calculations';
import {
  Search,
  Plus,
  Package,
  Tag,
  Shield,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (search.trim()) params.set('search', search.trim());
      params.set('activeOnly', 'false'); // Show active and allow seeing inactive for admin

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const categories = ['All', 'Tables', 'Cues', 'Accessories', 'General'];

  return (
    <div className="p-3.5 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Products</h1>

        <Link
          href="/products/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </Link>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, SKU, or keyword (e.g. ash, tournament, 12ft, aramith)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-foreground"
          />
        </form>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-semibold border-primary'
                  : 'bg-surface border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-surface animate-pulse rounded border border-border" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 border border-border rounded text-center bg-surface">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <div className="text-sm font-semibold text-foreground mb-3">No products found.</div>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="p-3.5 border border-border rounded bg-card hover:bg-surface transition-colors flex flex-col justify-between block relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                    {product.category}
                  </span>
                  {!product.active && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-danger-surface text-danger uppercase">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm text-foreground line-clamp-2">
                  {product.name}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  SKU: {product.sku}
                </div>

                {product.description && (
                  <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {product.description}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Unit Cost:</span>
                  <span className="font-bold text-foreground">
                    {product.cost_price > 0 ? formatINR(product.cost_price) : 'Cost Pending'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Recommended:</span>
                  <span className="font-semibold text-foreground">
                    {product.recommended_price ? formatINR(product.recommended_price) : '-'}
                  </span>
                </div>

                {product.minimum_price && (
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>Floor / Min:</span>
                    <span>{formatINR(product.minimum_price)}</span>
                  </div>
                )}

                {/* Keywords tags */}
                {product.keywords && product.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {product.keywords.slice(0, 4).map((kw, i) => (
                      <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                        #{kw}
                      </span>
                    ))}
                    {product.keywords.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">+{product.keywords.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
