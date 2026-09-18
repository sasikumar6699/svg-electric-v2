'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { CustomerDetailsForm } from '@/components/estimations/CustomerDetailsForm';
import { QuotationMetaForm } from '@/components/estimations/QuotationMetaForm';
import { ItemsTable } from '@/components/estimations/ItemsTable';
import { FinancialSummaryCard } from '@/components/estimations/FinancialSummaryCard';
import { AddProductModal } from '@/components/estimations/AddProductModal';

export default function NewEstimationPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [estimationNumber, setEstimationNumber] = useState('EST-2026-...');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState(30);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('Tamil Nadu');

  const [items, setItems] = useState<any[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxType, setTaxType] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');

  // Installation & Commissioning
  const [installationType, setInstallationType] = useState<'PERCENTAGE' | 'FIXED' | 'NONE'>('PERCENTAGE');
  const [installationRate, setInstallationRate] = useState<number>(5.0);
  const [manualInstallationAmount, setManualInstallationAmount] = useState<number>(0);

  // Freight & Transportation
  const [freightType, setFreightType] = useState<'PERCENTAGE' | 'FIXED' | 'NONE'>('PERCENTAGE');
  const [freightRate, setFreightRate] = useState<number>(3.0);
  const [manualFreightAmount, setManualFreightAmount] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, custRes, setRes, meRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/products'),
          fetch('/api/customers'),
          fetch('/api/admin/settings'),
          fetch('/api/auth/me'),
        ]);

        const [catData, prodData, custData, setData, meData] = await Promise.all([
          catRes.json(),
          prodRes.json(),
          custRes.json(),
          setRes.json(),
          meRes.json(),
        ]);

        setCategories(catData.categories || []);
        setAllProducts(prodData.products || []);
        setCustomers(custData.customers || []);
        setSettings(setData.settings || null);
        setCurrentUser(meData.user || null);

        if (setData.settings) {
          const s = setData.settings;
          const prefix = s.estimationPrefix || 'EST-';
          const next = s.estimationNextNum || 1001;
          const yr = new Date().getFullYear();
          setEstimationNumber(
            s.yearBasedNumbering
              ? `${prefix}${yr}-${String(next).padStart(5, '0')}`
              : `${prefix}${String(next).padStart(6, '0')}`
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const c = customers.find((x: any) => x.id === custId);
    if (c) {
      setCompanyName(c.companyName);
      setCustomerName(c.customerName);
      setContactPerson(c.contactPerson || '');
      setPhone(c.phone);
      setEmail(c.email || '');
      setAddress(c.address);
      setGstin(c.gstin || '');
      setState(c.state || 'Tamil Nadu');
    }
  };

  const handleAddItem = (newItem: any) => {
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Financial calculations
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const discountAmount = Math.round((subtotal * (discountPercent || 0)) / 100 * 100) / 100;
  const netSubtotal = Math.max(0, subtotal - discountAmount);

  let effectiveInstallationAmount = 0;
  if (installationType === 'PERCENTAGE') {
    effectiveInstallationAmount = Math.round((netSubtotal * (installationRate || 0)) / 100 * 100) / 100;
  } else if (installationType === 'FIXED') {
    effectiveInstallationAmount = manualInstallationAmount || 0;
  }

  let effectiveFreightAmount = 0;
  if (freightType === 'PERCENTAGE') {
    effectiveFreightAmount = Math.round((netSubtotal * (freightRate || 0)) / 100 * 100) / 100;
  } else if (freightType === 'FIXED') {
    effectiveFreightAmount = manualFreightAmount || 0;
  }

  const taxableAmount = Math.max(0, netSubtotal + effectiveInstallationAmount + effectiveFreightAmount);

  const cgstRate = taxType === 'INTRA_STATE' ? (settings?.defaultCGSTRate ?? 9.0) : 0;
  const sgstRate = taxType === 'INTRA_STATE' ? (settings?.defaultSGSTRate ?? 9.0) : 0;
  const igstRate = taxType === 'INTER_STATE' ? (settings?.defaultIGSTRate ?? 18.0) : 0;

  const cgstAmount = Math.round((taxableAmount * cgstRate) / 100 * 100) / 100;
  const sgstAmount = Math.round((taxableAmount * sgstRate) / 100 * 100) / 100;
  const igstAmount = Math.round((taxableAmount * igstRate) / 100 * 100) / 100;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  const handleSubmit = async (status: 'DRAFT' | 'PENDING_APPROVAL') => {
    if (!companyName || !customerName || !phone || !address) {
      setErrorMessage('Please fill in Customer Details (Company, Customer Name, Phone, and Address).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one product to the estimation.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        companyName,
        customerName,
        contactPerson,
        phone,
        email,
        address,
        gstin,
        state,
        referenceNumber,
        date,
        validityDays,
        remarks,
        discountPercent,
        taxType,
        installationType,
        installationRate: installationType === 'PERCENTAGE' ? installationRate : 0,
        installationAmount: effectiveInstallationAmount,
        freightType,
        freightRate: freightType === 'PERCENTAGE' ? freightRate : 0,
        freightAmount: effectiveFreightAmount,
        status,
        items,
      };

      const res = await fetch('/api/estimations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save estimation');
      }

      router.push(`/estimations/${data.estimation.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <span className="text-xs font-mono">Initializing Estimation Console...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Action Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              NEW ESTIMATION
            </span>
            <span className="text-xs text-slate-400 font-mono">#{estimationNumber}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Create Electrical Panel Estimation</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('DRAFT')}
            className="px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit('PENDING_APPROVAL')}
            className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 ${
              currentUser?.role === 'ADMIN'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : currentUser?.role === 'ADMIN' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <FileCheck className="w-3.5 h-3.5" />
            )}
            <span>
              {currentUser?.role === 'ADMIN' ? 'Create & Approve Estimation' : 'Submit for Admin Approval'}
            </span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: Customer Details & Quotation Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomerDetailsForm
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            onCustomerSelect={handleCustomerSelect}
            companyName={companyName}
            setCompanyName={setCompanyName}
            customerName={customerName}
            setCustomerName={setCustomerName}
            contactPerson={contactPerson}
            setContactPerson={setContactPerson}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            address={address}
            setAddress={setAddress}
            gstin={gstin}
            setGstin={setGstin}
            state={state}
            setState={setState}
          />
        </div>

        <div className="lg:col-span-1">
          <QuotationMetaForm
            date={date}
            setDate={setDate}
            validityDays={validityDays}
            setValidityDays={setValidityDays}
            referenceNumber={referenceNumber}
            setReferenceNumber={setReferenceNumber}
            remarks={remarks}
            setRemarks={setRemarks}
          />
        </div>
      </div>

      {/* Configured Products Table */}
      <ItemsTable
        items={items}
        onOpenAddModal={() => setIsModalOpen(true)}
        onRemoveItem={handleRemoveItem}
      />

      {/* Financial Summary & Commercial Configuration Card */}
      <FinancialSummaryCard
        subtotal={subtotal}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        discountAmount={discountAmount}
        installationType={installationType}
        setInstallationType={setInstallationType}
        installationRate={installationRate}
        setInstallationRate={setInstallationRate}
        installationAmount={effectiveInstallationAmount}
        setInstallationAmount={setManualInstallationAmount}
        freightType={freightType}
        setFreightType={setFreightType}
        freightRate={freightRate}
        setFreightRate={setFreightRate}
        freightAmount={effectiveFreightAmount}
        setFreightAmount={setManualFreightAmount}
        taxableAmount={taxableAmount}
        taxType={taxType}
        setTaxType={setTaxType}
        cgstRate={cgstRate}
        cgstAmount={cgstAmount}
        sgstRate={sgstRate}
        sgstAmount={sgstAmount}
        igstRate={igstRate}
        igstAmount={igstAmount}
        grandTotal={grandTotal}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
        allProducts={allProducts}
        onAddProduct={handleAddItem}
      />
    </div>
  );
}