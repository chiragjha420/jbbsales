'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sale, PaymentMethod } from '@/types';
import { formatINR, formatDate } from '@/lib/calculations';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Upload,
  X,
  ShieldAlert,
} from 'lucide-react';

export default function SaleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Payment Modal State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('upi');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [newPaymentProofs, setNewPaymentProofs] = useState<Array<{ fileName: string; mimeType: string; dataUrl: string; size: number }>>([]);
  const [savingPayment, setSavingPayment] = useState(false);

  // Add Additional Proof Modal State (for an existing payment)
  const [targetPaymentId, setTargetPaymentId] = useState<string | null>(null);
  const [extraProofFile, setExtraProofFile] = useState<{ fileName: string; mimeType: string; dataUrl: string; size: number } | null>(null);
  const [uploadingExtraProof, setUploadingExtraProof] = useState(false);

  // Full Screen Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSale();
  }, [params.id]);

  const loadSale = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${params.id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load sale details.');
        setSale(null);
      } else {
        setSale(data.sale);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching sale.');
    } finally {
      setLoading(false);
    }
  };

  const handleProofFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setNewPaymentProofs((prev) => [
          ...prev,
          {
            fileName: file.name,
            mimeType: file.type,
            dataUrl: reader.result as string,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExtraProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setExtraProofFile({
        fileName: file.name,
        mimeType: file.type,
        dataUrl: reader.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (newPaymentProofs.length === 0) {
      alert('Payment proof screenshot is mandatory.');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch(`/api/sales/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: newPaymentMethod,
          notes: newPaymentNotes.trim() || undefined,
          proofs: newPaymentProofs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to record payment.');
      } else {
        setSale(data.sale);
        setShowAddPaymentModal(false);
        setNewPaymentAmount('');
        setNewPaymentNotes('');
        setNewPaymentProofs([]);
      }
    } catch {
      alert('Network error while saving payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleUploadExtraProof = async () => {
    if (!targetPaymentId || !extraProofFile) return;

    setUploadingExtraProof(true);
    try {
      const res = await fetch(`/api/sales/${params.id}/proofs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: targetPaymentId,
          fileName: extraProofFile.fileName,
          mimeType: extraProofFile.mimeType,
          dataUrl: extraProofFile.dataUrl,
          size: extraProofFile.size,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to attach additional proof.');
      } else {
        setSale(data.sale);
        setTargetPaymentId(null);
        setExtraProofFile(null);
      }
    } catch {
      alert('Network error while uploading proof.');
    } finally {
      setUploadingExtraProof(false);
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

  if (error || !sale) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-danger mx-auto" />
        <div className="text-base font-semibold">{error || 'Sale not found.'}</div>
        <Link
          href="/sales"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3.5 md:p-6 max-w-4xl mx-auto space-y-4 pb-24">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Link
            href="/sales"
            className="p-1.5 border border-border rounded text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-mono font-bold text-base md:text-lg">{sale.sale_number}</h1>
            {sale.payment_status === 'paid' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-success-surface text-success font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Paid</span>
              </span>
            ) : sale.payment_status === 'partially_paid' ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-warning-surface text-warning font-semibold">
                <Clock className="w-3 h-3" />
                <span>Partially Paid</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-danger-surface text-danger font-semibold">
                <AlertCircle className="w-3 h-3" />
                <span>Unpaid</span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddPaymentModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Primary Customer & Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-surface border border-border rounded space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Customer</div>
          <div className="font-bold text-sm text-foreground">{sale.customer_name_snapshot}</div>
          {sale.customer && (
            <div className="text-muted-foreground">
              {sale.customer.company && <span>{sale.customer.company} • </span>}
              <span>{sale.customer.phone}</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-surface border border-border rounded space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase font-semibold">Date & Salesperson</div>
          <div className="font-semibold text-foreground">
            {sale.salesperson?.full_name || 'Assigned Rep'}
          </div>
          <div className="text-muted-foreground">
            {formatDate(sale.sale_date, false)}
          </div>
        </div>
      </div>

      {/* Products List: NO horizontal scroll on phone */}
      <div className="border border-border rounded overflow-hidden bg-card">
        <div className="p-3 bg-surface border-b border-border font-semibold text-xs text-foreground uppercase tracking-wider">
          Products
        </div>

        {/* Mobile View: Stacked Card Rows (100% width, zero horizontal scrolling) */}
        <div className="divide-y divide-border block sm:hidden">
          {sale.items?.map((item) => (
            <div key={item.id} className="p-3 text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-foreground">{item.product_name_snapshot}</div>
                  {item.sku_snapshot && (
                    <div className="text-[11px] text-muted-foreground font-mono">{item.sku_snapshot}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-foreground">{formatINR(item.line_revenue)}</div>
                  <div className="text-[11px] text-success font-semibold">+{formatINR(item.line_profit)} profit</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/50 text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Qty</span>
                  <span className="font-medium text-foreground">{item.quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Selling Price</span>
                  <span className="font-medium text-foreground">{formatINR(item.selling_price)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase">Cost (Snapshot)</span>
                  <span className="font-mono text-muted-foreground">{formatINR(item.cost_at_sale)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View Table: Full visible width */}
        <table className="w-full text-left text-xs hidden sm:table">
          <thead className="bg-muted text-muted-foreground uppercase text-[10px] border-b border-border">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Selling Price</th>
              <th className="p-3 text-right">Cost (Snapshot)</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sale.items?.map((item) => (
              <tr key={item.id} className="hover:bg-surface/50">
                <td className="p-3">
                  <div className="font-semibold text-foreground text-sm">{item.product_name_snapshot}</div>
                  {item.sku_snapshot && (
                    <div className="text-[11px] text-muted-foreground font-mono">{item.sku_snapshot}</div>
                  )}
                </td>
                <td className="p-3 text-right font-medium">{item.quantity}</td>
                <td className="p-3 text-right font-medium">{formatINR(item.selling_price)}</td>
                <td className="p-3 text-right text-muted-foreground font-mono">
                  {formatINR(item.cost_at_sale)}
                </td>
                <td className="p-3 text-right font-bold text-foreground">
                  {formatINR(item.line_revenue)}
                </td>
                <td className="p-3 text-right font-bold text-success">
                  {formatINR(item.line_profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Courier & Totals Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Charges */}
        <div className="p-3 bg-surface border border-border rounded space-y-2">
          <div className="font-semibold uppercase text-muted-foreground tracking-wide text-[10px]">
            Delivery & Charges
          </div>
          <div className="space-y-1.5 divide-y divide-border/60">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Courier Charged</span>
              <span className="font-semibold">{formatINR(sale.courier_charge)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Actual Courier Cost</span>
              <span className="font-mono text-muted-foreground">{formatINR(sale.courier_cost)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Other Charges</span>
              <span className="font-semibold">{formatINR(sale.other_charge)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Other Cost</span>
              <span className="font-mono text-muted-foreground">{formatINR(sale.other_cost)}</span>
            </div>
            {sale.notes && (
              <div className="pt-2 text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>
                {sale.notes}
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="p-3 bg-surface border border-border rounded space-y-2">
          <div className="font-semibold uppercase text-muted-foreground tracking-wide text-[10px]">
            Financial Summary
          </div>
          <div className="space-y-1.5 divide-y divide-border/60">
            <div className="flex justify-between py-1 text-sm font-bold">
              <span>Total Revenue</span>
              <span>{formatINR(sale.total_revenue)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>Total Cost</span>
              <span className="font-mono">{formatINR(sale.total_cost)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-bold text-success">
              <span>Gross Profit</span>
              <span>{formatINR(sale.gross_profit)} ({sale.gross_margin.toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between py-1 text-foreground font-semibold">
              <span>Paid</span>
              <span>{formatINR(sale.total_paid || 0)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-bold">
              <span>Outstanding</span>
              <span className={sale.outstanding && sale.outstanding > 0 ? 'text-danger' : 'text-success'}>
                {formatINR(sale.outstanding || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Records & Screenshots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-xs text-foreground uppercase tracking-wide">
            Payments ({sale.payments?.length || 0})
          </div>
          <button
            type="button"
            onClick={() => setShowAddPaymentModal(true)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Payment</span>
          </button>
        </div>

        {(!sale.payments || sale.payments.length === 0) ? (
          <div className="p-4 border border-border rounded text-center bg-surface text-xs text-muted-foreground">
            No payments recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sale.payments.map((p, pIdx) => (
              <div key={p.id} className="p-3 border border-border rounded bg-card space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2 text-xs">
                  <div>
                    <strong className="text-sm font-bold text-foreground">{formatINR(p.amount)}</strong>
                    <span className="ml-2 uppercase px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                      {p.payment_method.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    {formatDate(p.payment_date, false)}
                    {p.notes && <span className="ml-1 text-foreground">· {p.notes}</span>}
                  </div>
                </div>

                {/* Screenshots Gallery */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      Screenshots ({p.proofs?.length || 0})
                    </span>

                    <button
                      type="button"
                      onClick={() => setTargetPaymentId(p.id)}
                      className="text-[11px] font-medium text-foreground underline hover:text-primary flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Add Screenshot</span>
                    </button>
                  </div>

                  {p.proofs && p.proofs.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {p.proofs.map((proof) => (
                        <div
                          key={proof.id}
                          onClick={() => setPreviewImageUrl(proof.storage_path)}
                          className="group cursor-pointer border border-border rounded overflow-hidden aspect-square bg-muted relative hover:border-foreground transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proof.storage_path}
                            alt={proof.file_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div className="font-bold text-sm">Add Payment</div>
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-medium">
                    Amount (₹) *
                  </label>
                  {sale.outstanding && sale.outstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewPaymentAmount(sale.outstanding!.toString())}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      Full Balance ({formatINR(sale.outstanding)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="50000"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded font-bold text-foreground focus:outline-none focus:border-foreground text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Payment Mode *
                </label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground text-xs focus:outline-none"
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Reference / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR / Ref Number"
                  value={newPaymentNotes}
                  onChange={(e) => setNewPaymentNotes(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                />
              </div>

              {/* Multiple Screenshot Upload */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Screenshot Proof *
                </label>
                <label className="border border-border hover:border-foreground border-dashed rounded p-3 cursor-pointer bg-surface flex flex-col items-center justify-center text-center">
                  <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                  <span className="font-semibold text-xs text-foreground">Attach Screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProofFilesSelect}
                    className="hidden"
                  />
                </label>

                {newPaymentProofs.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {newPaymentProofs.map((p, i) => (
                      <div key={i} className="relative aspect-square border border-border rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.dataUrl} alt="proof" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewPaymentProofs((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-background/80 hover:bg-danger text-foreground hover:text-white p-0.5 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-3 py-1.5 border border-border rounded text-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
                >
                  {savingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Extra Proof Modal */}
      {targetPaymentId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div className="font-bold text-sm">Add Screenshot</div>
              <button
                type="button"
                onClick={() => {
                  setTargetPaymentId(null);
                  setExtraProofFile(null);
                }}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="border border-border hover:border-foreground border-dashed rounded p-4 cursor-pointer bg-surface flex flex-col items-center justify-center text-center">
                <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="font-semibold text-xs text-foreground">
                  {extraProofFile ? extraProofFile.fileName : 'Select Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleExtraProofSelect}
                  className="hidden"
                />
              </label>

              {extraProofFile && (
                <div className="w-20 h-20 mx-auto border border-border rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={extraProofFile.dataUrl} alt="extra" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setTargetPaymentId(null);
                    setExtraProofFile(null);
                  }}
                  className="px-3 py-1.5 border border-border rounded text-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!extraProofFile || uploadingExtraProof}
                  onClick={handleUploadExtraProof}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
                >
                  {uploadingExtraProof ? 'Uploading...' : 'Save Screenshot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 p-1 text-white hover:text-danger"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt="Payment Proof Full"
              className="max-h-[85vh] max-w-full object-contain rounded border border-border"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
