'use client';

import React from 'react';
import { Building } from 'lucide-react';

interface CustomerDetailsFormProps {
  customers: any[];
  selectedCustomerId: string;
  onCustomerSelect: (id: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  contactPerson: string;
  setContactPerson: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  gstin: string;
  setGstin: (v: string) => void;
  state: string;
  setState: (v: string) => void;
}

export const CustomerDetailsForm: React.FC<CustomerDetailsFormProps> = ({
  customers,
  selectedCustomerId,
  onCustomerSelect,
  companyName,
  setCompanyName,
  customerName,
  setCustomerName,
  contactPerson,
  setContactPerson,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  gstin,
  setGstin,
  state,
  setState,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Building className="w-4 h-4 text-brand-600" />
          <span>Customer Details</span>
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Load Customer:</span>
          <select
            value={selectedCustomerId}
            onChange={(e) => onCustomerSelect(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">-- New Customer / Manual --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Company / Organization *</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Lakshmi Machine Works Ltd"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Client Contact Name *</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. K. Balasubramanian"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Attention / Designation</label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Chief Engineer - Electrical"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Phone / Mobile *</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 94421 11223"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="electrical@company.com"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            placeholder="33AAACL1234E1ZQ"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Billing & Delivery Address *</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Complete plant / site address with pincode..."
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-brand-500"
            required
          />
        </div>
      </div>
    </div>
  );
};