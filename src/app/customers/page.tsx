'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Customer } from '@/types';
import {
  Search,
  UserPlus,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

export default function CustomersPage() {
  const { user, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and phone are required.');
      return;
    }

    setSavingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim() || undefined,
          contact_person: contactPerson.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomers((prev) => [data.customer, ...prev]);
        setShowAddModal(false);
        // Reset form
        setName('');
        setCompany('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        setCity('');
        setNotes('');
      } else {
        alert(data.error || 'Failed to save customer.');
      }
    } catch {
      alert('Network error while saving customer.');
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <div className="p-3.5 md:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">Customers</h1>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs rounded transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by name, company, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-surface animate-pulse rounded border border-border" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="p-8 border border-border rounded text-center bg-surface">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <div className="text-sm font-semibold text-foreground">No customers found.</div>
        </div>
      ) : (
        <div className="border border-border rounded overflow-hidden divide-y divide-border bg-card">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-surface transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-foreground truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[c.company, c.phone, c.city].filter(Boolean).join(' · ')}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-card border border-border rounded-lg max-w-lg w-full shadow-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div className="font-bold text-sm">Add New Customer</div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                    Customer / Club Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Palms Sports Club"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                    Company / Entity Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Palms Hospitality Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Singhania"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@royalpalms.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Area / Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 bg-background border border-border rounded text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Club table configurations, preferences, or delivery nuances..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  disabled={savingCustomer}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary-hover disabled:opacity-50"
                >
                  {savingCustomer ? 'Saving...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
