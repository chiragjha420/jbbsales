'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Customer, Product, PaymentMethod } from '@/types';
import {
  calculateLineItem,
  calculateSaleTotals,
  formatINR,
  round2,
} from '@/lib/calculations';
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Upload,
  X,
  UserPlus,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';

interface SelectedItem {
  tempId: string;
  productId: string;
  productName: string;
  sku: string;
  costPrice: number;
  recommendedPrice: number | null;
  minimumPrice: number | null;
  quantity: number;
  sellingPrice: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Reference lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Quick add customer modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickCompany, setQuickCompany] = useState('');
  const [savingQuickCustomer, setSavingQuickCustomer] = useState(false);

  // Items
  const [items, setItems] = useState<SelectedItem[]>([]);

  // Product picker modal / selector
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Charges
  const [courierCharge, setCourierCharge] = useState<string>('');
  const [courierCost, setCourierCost] = useState<string>('');
  const [otherCharge, setOtherCharge] = useState<string>('');
  const [otherCost, setOtherCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Payment section
  const [hasPayment, setHasPayment] = useState<boolean>(true);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [proofFiles, setProofFiles] = useState<Array<{ fileName: string; mimeType: string; dataUrl: string; size: number }>>([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial customers and products
  useEffect(() => {
    async function init() {
      try {
        setLoadingData(true);
        const [custRes, prodRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/products?activeOnly=true'),
        ]);
        const custData = await custRes.json();
        const prodData = await prodRes.json();

        setCustomers(custData.customers || []);
        setProducts(prodData.products || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, []);

  // Filtered customers for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Filtered products for product picker
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 12);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  // Financial calculations
  const saleTotals = useMemo(() => {
    return calculateSaleTotals({
      items: items.map((i) => ({
        quantity: i.quantity,
        sellingPrice: i.sellingPrice,
        costAtSale: i.costPrice,
      })),
      courierCharge: courierCharge ? parseFloat(courierCharge) : 0,
      courierCost: courierCost ? parseFloat(courierCost) : 0,
      otherCharge: otherCharge ? parseFloat(otherCharge) : 0,
      otherCost: otherCost ? parseFloat(otherCost) : 0,
    });
  }, [items, courierCharge, courierCost, otherCharge, otherCost]);

  // If user clicks full payment helper
  const setFullPayment = () => {
    setPaymentAmount(saleTotals.totalRevenue.toString());
  };

  // Add product to sale
  const handleSelectProduct = (prod: Product) => {
    const defaultPrice = prod.recommended_price || prod.cost_price || 0;
    const newItem: SelectedItem = {
      tempId: crypto.randomUUID(),
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      costPrice: prod.cost_price || 0,
      recommendedPrice: prod.recommended_price,
      minimumPrice: prod.minimum_price,
      quantity: 1,
      sellingPrice: defaultPrice,
    };
    setItems((prev) => [...prev, newItem]);
    setShowProductPicker(false);
    setProductSearch('');
  };

  const updateItemQty = (tempId: string, val: string) => {
    const qty = parseFloat(val);
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, quantity: isNaN(qty) ? 0 : qty } : i))
    );
  };

  const updateItemPrice = (tempId: string, val: string) => {
    const price = parseFloat(val);
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, sellingPrice: isNaN(price) ? 0 : price } : i))
    );
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  // Handle image upload
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setProofFiles((prev) => [
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

  const removeProof = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick Add Customer Handler
  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickPhone.trim()) {
      alert('Customer name and phone are required.');
      return;
    }

    setSavingQuickCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickName.trim(),
          phone: quickPhone.trim(),
          company: quickCompany.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomers((prev) => [data.customer, ...prev]);
        setSelectedCustomerId(data.customer.id);
        setShowQuickAddModal(false);
        setQuickName('');
        setQuickPhone('');
        setQuickCompany('');
      } else {
        alert(data.error || 'Failed to create customer.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setSavingQuickCustomer(false);
    }
  };

  // Submit Sale
  const handleSubmitSale = async () => {
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Add at least one product to the sale.');
      return;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        setErrorMessage(`Enter a valid quantity for ${item.productName}.`);
        return;
      }
      if (item.sellingPrice < 0) {
        setErrorMessage(`Selling price cannot be negative for ${item.productName}.`);
        return;
      }
    }

    const numericPayment = paymentAmount ? parseFloat(paymentAmount) : 0;
    if (hasPayment && numericPayment > 0) {
      if (proofFiles.length === 0) {
        setErrorMessage('Payment proof screenshot is required when recording payment.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        salespersonId: user?.id,
        customerId: selectedCustomerId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          sellingPrice: i.sellingPrice,
        })),
        courierCharge: courierCharge ? parseFloat(courierCharge) : 0,
        courierCost: courierCost ? parseFloat(courierCost) : 0,
        otherCharge: otherCharge ? parseFloat(otherCharge) : 0,
        otherCost: otherCost ? parseFloat(otherCost) : 0,
        notes: notes.trim() || undefined,
      };

      if (hasPayment && numericPayment > 0) {
        payload.initialPayment = {
          amount: numericPayment,
          paymentMethod,
          notes: paymentNotes.trim() || undefined,
          proofs: proofFiles,
        };
      }

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to record sale.');
        setSubmitting(false);
        return;
      }

      // Success: redirect to sale detail
      router.push(`/sales/${data.sale.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while saving sale.');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 md:p-6 max-w-4xl mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">New Sale</h1>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs bg-danger-surface text-danger border border-danger/30 rounded flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Customer Selection */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Customer <span className="text-danger">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowQuickAddModal(true)}
            className="text-xs text-foreground font-semibold hover:underline inline-flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Quick Add Customer</span>
          </button>
        </div>

        {selectedCustomer ? (
          <div className="p-2.5 bg-background border border-border rounded flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-foreground">{selectedCustomer.name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedCustomer.company ? `${selectedCustomer.company} · ` : ''}
                {selectedCustomer.phone}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCustomerId('');
                setCustomerSearch('');
              }}
              className="text-xs text-muted-foreground hover:text-foreground p-1"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center border border-border rounded bg-background px-2.5 py-1.5 focus-within:border-foreground">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search by customer name, company, or phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
              />
            </div>

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-20 max-h-56 overflow-y-auto divide-y divide-border">
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground text-center">
                    No customer found.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerDropdown(false);
                        setShowQuickAddModal(true);
                      }}
                      className="text-foreground underline font-medium"
                    >
                      Quick Add
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-surface text-xs flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{c.name}</div>
                        <div className="text-muted-foreground text-[11px]">
                          {c.company ? `${c.company} · ` : ''}
                          {c.phone}
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Selection */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Products <span className="text-danger">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowProductPicker(true)}
            className="text-xs bg-primary text-primary-foreground hover:bg-primary-hover px-2.5 py-1.5 rounded font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded text-center">
            <div className="text-xs text-muted-foreground mb-2">No products added to this sale yet.</div>
            <button
              type="button"
              onClick={() => setShowProductPicker(true)}
              className="text-xs underline font-semibold text-foreground"
            >
              + Browse & Select Products
            </button>
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-border">
            {items.map((item, idx) => {
              const lineCalc = calculateLineItem(item.quantity, item.sellingPrice, item.costPrice);
              const belowMin = item.minimumPrice !== null && item.sellingPrice < item.minimumPrice;

              return (
                <div key={item.tempId} className={`pt-3 space-y-2 ${idx === 0 ? 'pt-0' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{item.productName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        SKU: {item.sku} · Unit Cost:{' '}
                        <strong className="text-foreground">
                          {item.costPrice > 0 ? formatINR(item.costPrice) : 'Cost Pending'}
                        </strong>
                        {item.recommendedPrice && ` · Rec: ${formatINR(item.recommendedPrice)}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="text-muted-foreground hover:text-danger p-1"
                      title="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity & Negotiated Selling Price Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateItemQty(item.tempId, e.target.value)}
                        className="w-full p-2 bg-background border border-border rounded font-semibold text-foreground focus:outline-none focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.sellingPrice || ''}
                        onChange={(e) => updateItemPrice(item.tempId, e.target.value)}
                        className={`w-full p-2 bg-background border rounded font-semibold text-foreground focus:outline-none ${
                          belowMin ? 'border-warning' : 'border-border focus:border-foreground'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                        Line Revenue
                      </label>
                      <div className="p-2 bg-muted rounded font-bold text-foreground">
                        {formatINR(lineCalc.lineRevenue)}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                        Line Profit
                      </label>
                      <div className="p-2 bg-muted rounded font-bold text-success flex justify-between items-center">
                        <span>{formatINR(lineCalc.lineProfit)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {lineCalc.lineRevenue > 0
                            ? `${((lineCalc.lineProfit / lineCalc.lineRevenue) * 100).toFixed(0)}%`
                            : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Below minimum price warning if salesperson enters lower negotiated rate */}
                  {belowMin && (
                    <div className="text-[11px] text-warning flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Below configured minimum price of {formatINR(item.minimumPrice!)}. Warned but allowed.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Courier & Other Charges */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase block">
          Delivery & Charges
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Courier */}
          <div className="p-2.5 bg-background border border-border rounded space-y-2">
            <div className="font-semibold text-foreground">Courier / Transport</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Charged to Customer
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={courierCharge}
                  onChange={(e) => setCourierCharge(e.target.value)}
                  className="w-full p-1.5 bg-surface border border-border rounded text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Actual Courier Cost
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={courierCost}
                  onChange={(e) => setCourierCost(e.target.value)}
                  className="w-full p-1.5 bg-surface border border-border rounded text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Other charges */}
          <div className="p-2.5 bg-background border border-border rounded space-y-2">
            <div className="font-semibold text-foreground">Other / Fitting / Labor</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Billed to Customer
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={otherCharge}
                  onChange={(e) => setOtherCharge(e.target.value)}
                  className="w-full p-1.5 bg-surface border border-border rounded text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Actual Direct Cost
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  className="w-full p-1.5 bg-surface border border-border rounded text-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
            Order Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Delivery requested by next Friday, special cue case included"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Live Financial Summary Box */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-2 text-xs">
        <div className="font-semibold text-muted-foreground uppercase tracking-wide">
          Profitability Breakdown
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2 bg-background border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase">Product Revenue</div>
            <div className="font-bold text-sm text-foreground">{formatINR(saleTotals.productRevenue)}</div>
          </div>
          <div className="p-2 bg-background border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase">Total Sale Revenue</div>
            <div className="font-bold text-sm text-foreground">{formatINR(saleTotals.totalRevenue)}</div>
          </div>
          <div className="p-2 bg-background border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase">Total Actual Cost</div>
            <div className="font-bold text-sm text-foreground">{formatINR(saleTotals.totalCost)}</div>
          </div>
          <div className="p-2 bg-background border border-border rounded">
            <div className="text-[10px] text-muted-foreground uppercase">Gross Profit (Margin)</div>
            <div className="font-bold text-sm text-success">
              {formatINR(saleTotals.grossProfit)}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                ({saleTotals.grossMargin.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Payment Proof Screenshots */}
      <div className="p-3.5 bg-surface border border-border rounded space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Payment
          </label>
        </div>

        {/* Clean Segmented Mode Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-background border border-border rounded text-xs">
          <button
            type="button"
            onClick={() => setHasPayment(true)}
            className={`py-2 px-3 rounded font-semibold transition-colors text-center ${
              hasPayment
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Payment Received
          </button>
          <button
            type="button"
            onClick={() => {
              setHasPayment(false);
              setPaymentAmount('');
              setProofFiles([]);
            }}
            className={`py-2 px-3 rounded font-semibold transition-colors text-center ${
              !hasPayment
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unpaid (Pay Later)
          </button>
        </div>

        {hasPayment ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-medium">
                    Amount Received (₹) <span className="text-danger">*</span>
                  </label>
                  {saleTotals.totalRevenue > 0 && (
                    <button
                      type="button"
                      onClick={setFullPayment}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline"
                    >
                      Full Amount ({formatINR(saleTotals.totalRevenue)})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded font-semibold text-foreground focus:outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Payment Method <span className="text-danger">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground text-xs focus:outline-none"
                >
                  <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="cash">Cash Received</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="UPI Ref / UTR / Cheque number"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Proof Upload Area */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1.5">
                Attach Payment Screenshots <span className="text-danger">*</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <label className="border border-border hover:border-foreground border-dashed rounded px-3 py-2 cursor-pointer bg-background inline-flex items-center gap-1.5 text-xs text-foreground">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span>Choose Screenshots</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProofUpload}
                    className="hidden"
                  />
                </label>

                {proofFiles.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {proofFiles.length} screenshot(s) attached
                  </span>
                )}
              </div>

              {/* Thumbnail Previews */}
              {proofFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2.5">
                  {proofFiles.map((proof, idx) => (
                    <div key={idx} className="relative group border border-border rounded overflow-hidden aspect-square bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proof.dataUrl}
                        alt={`Proof ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeProof(idx)}
                        className="absolute top-1 right-1 bg-background/80 hover:bg-danger hover:text-white p-1 rounded-full text-foreground transition-colors"
                        title="Remove screenshot"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground p-2.5 bg-background border border-border rounded">
            This sale will be marked as <strong className="text-danger">Unpaid</strong>. Payment and screenshots can be recorded later.
          </div>
        )}
      </div>

      {/* Save Action Sticky / Fixed Bottom for Mobile Speed */}
      <div className="pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmitSale}
          className="w-full py-3.5 px-4 bg-primary text-primary-foreground hover:bg-primary-hover font-bold text-base rounded shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <span>Saving Sale...</span>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Confirm & Record Sale</span>
            </>
          )}
        </button>
      </div>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="font-bold text-sm">Select Product</div>
              <button
                type="button"
                onClick={() => setShowProductPicker(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border">
              <div className="flex items-center border border-border rounded bg-background px-2.5 py-1.5 focus-within:border-foreground">
                <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, or keyword (e.g. cue, 12ft, chalk)..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-border flex-1 p-2">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No matching products found.
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProduct(p)}
                    className="w-full text-left p-2.5 hover:bg-surface rounded text-xs flex items-center justify-between gap-2 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground text-sm">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        SKU: {p.sku} · Category: {p.category}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-2">
                        <span>Cost: <strong className="text-foreground">{formatINR(p.cost_price)}</strong></span>
                        {p.recommended_price && (
                          <span>Recommended: <strong className="text-foreground">{formatINR(p.recommended_price)}</strong></span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-semibold shrink-0">
                      Select
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full shadow-2xl p-4 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div className="font-bold text-sm">Quick Add Customer</div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Customer / Club Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Billiards Club"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Company / Organization (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zenith Hospitality LLP"
                  value={quickCompany}
                  onChange={(e) => setQuickCompany(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none focus:border-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-3 py-1.5 border border-border rounded text-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickCustomer}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
                >
                  {savingQuickCustomer ? 'Saving...' : 'Add & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
