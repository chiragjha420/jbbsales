'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Check, AlertTriangle, Star } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [recommendedPrice, setRecommendedPrice] = useState('');
  const [minimumPrice, setMinimumPrice] = useState('');
  const [category, setCategory] = useState('Tables');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [images, setImages] = useState<Array<{ fileName: string; dataUrl: string; isPrimary: boolean }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add keyword
  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const clean = keywordInput.trim().toLowerCase();
    if (!keywords.includes(clean)) {
      setKeywords((prev) => [...prev, clean]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            fileName: file.name,
            dataUrl: reader.result as string,
            isPrimary: prev.length === 0, // First uploaded is primary by default
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Ensure at least one is primary if any exist
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    const numericCost = parseFloat(costPrice);
    if (isNaN(numericCost) || numericCost < 0) {
      setError('A valid cost price (₹) is required.');
      return;
    }

    if (images.length === 0) {
      setError('At least one product photo is required.');
      return;
    }

    if (keywords.length === 0) {
      setError('At least one keyword is required for product searchability.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        cost_price: numericCost,
        recommended_price: recommendedPrice ? parseFloat(recommendedPrice) : undefined,
        minimum_price: minimumPrice ? parseFloat(minimumPrice) : undefined,
        category,
        keywords,
        images,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product.');
        setSubmitting(false);
      } else {
        router.push(`/products/${data.product.id}`);
      }
    } catch {
      setError('Network error while saving product.');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 md:p-6 max-w-3xl mx-auto space-y-5 pb-24">
      {/* Top Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Link
          href="/products"
          className="p-1.5 border border-border rounded text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">New Product</h1>
      </div>

      {error && (
        <div className="p-3 text-xs bg-danger-surface text-danger border border-danger/30 rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Core details */}
        <div className="p-3.5 bg-surface border border-border rounded space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
              Product Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tournament Snooker Table 12ft English Slates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-background border border-border rounded text-foreground text-sm focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Category <span className="text-danger">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
              >
                <option value="Tables">Tables (Snooker / Pool / Billiards)</option>
                <option value="Cues">Cues (Ash / Maple / Handcrafted)</option>
                <option value="Accessories">Accessories (Balls / Cloth / Chalk / Gloves)</option>
                <option value="General">General / Spares</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                SKU / Item Code (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to auto-generate"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
              Description / Specifications (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 5-piece 45mm English slates, Northern rubber cushions, solid mahogany frame..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Pricing Economics */}
        <div className="p-3.5 bg-surface border border-border rounded space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Cost Price (Company Cost) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="₹ 0.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground font-bold focus:outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Recommended Price (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="₹ 0.00"
                value={recommendedPrice}
                onChange={(e) => setRecommendedPrice(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                Minimum Floor Price (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="₹ 0.00"
                value={minimumPrice}
                onChange={(e) => setMinimumPrice(e.target.value)}
                className="w-full p-2 bg-background border border-border rounded text-foreground font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Photos Upload */}
        <div className="p-3.5 bg-surface border border-border rounded space-y-3">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-foreground uppercase tracking-wide text-[11px]">
              Photos <span className="text-danger">*</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Select multiple images if needed</span>
          </div>

          <label className="border border-border hover:border-foreground border-dashed rounded p-4 cursor-pointer bg-background flex flex-col items-center justify-center text-center">
            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
            <span className="font-semibold text-xs text-foreground">Upload Product Photos</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WebP supported</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square border border-border rounded overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt={img.fileName} className="w-full h-full object-cover" />
                  
                  {img.isPrimary ? (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Primary</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(i)}
                      className="absolute top-1 left-1 bg-background/80 hover:bg-background text-foreground text-[9px] font-medium px-1.5 py-0.5 rounded opacity-80 group-hover:opacity-100"
                    >
                      Make Primary
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-background/80 hover:bg-danger text-foreground hover:text-white p-1 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Keywords */}
        <div className="p-3.5 bg-surface border border-border rounded space-y-2.5">
          <div className="font-semibold text-foreground uppercase tracking-wide text-[11px]">
            Keywords <span className="text-danger">*</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type keyword and press Enter or Add..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              className="flex-1 p-2 bg-background border border-border rounded text-foreground focus:outline-none"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="px-3 py-2 bg-surface border border-border rounded font-semibold text-foreground hover:bg-muted"
            >
              Add
            </button>
          </div>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-background border border-border text-foreground"
                >
                  <span>#{kw}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary-hover font-bold text-sm rounded shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Saving Product...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Product to Catalog</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
