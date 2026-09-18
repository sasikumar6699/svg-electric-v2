'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, FileCheck, Loader2, RotateCcw } from 'lucide-react';
import { CustomerDetailsForm } from '@/components/estimations/CustomerDetailsForm';
import { QuotationMetaForm } from '@/components/estimations/QuotationMetaForm';
import { ItemsTable } from '@/components/estimations/ItemsTable';
import { FinancialSummaryCard } from '@/components/estimations/FinancialSummaryCard';
import { AddProductModal } from '@/components/estimations/AddProductModal';

export default function EditEstimationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('DRAFT');
  const [approvalRemarks, setApprovalRemarks] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [estimationNumber, setEstimationNumber] = useState('');
  const [date, setDate] = useState('');
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
        const [catRes, prodRes, custRes, setRes, estRes, meRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/products'),
          fetch('/api/customers'),
          fetch('/api/admin/settings'),
          fetch(`/api/estimations/${id}`),
          fetch('/api/auth/me'),
        ]);

        const [catData, prodData, custData, setData, estData, meData] = await Promise.all([
          catRes.json(),
          prodRes.json(),
          custRes.json(),
          setRes.json(),
          estRes.json(),
          meRes.json(),
        ]);

        setCategories(catData.categories || []);
        setAllProducts(prodData.products || []);
        setCustomers(custData.customers || []);
        setSettings(setData.settings || null);
        setCurrentUser(meData.user || null);

        if (estData.estimation) {
          const e = estData.estimation;
          setCurrentStatus(e.status);
          setApprovalRemarks(e.approvalRemarks || null);
          setEstimationNumber(e.estimationNumber);
          setDate(e.date ? new Date(e.date).toISOString().split('T')[0] : '');
          setValidityDays(e.validityDays);
          setReferenceNumber(e.referenceNumber || '');
          setRemarks(e.remarks || '');
          setSelectedCustomerId(e.customerId || '');
          setCompanyName(e.companyName);
          setCustomerName(e.customerName);
          setContactPerson(e.contactPerson || '');
          setPhone(e.phone);
          setEmail(e.email || '');
          setAddress(e.address);
          setGstin(e.gstin || '');
          setState(e.state || 'Tamil Nadu');
          setDiscountPercent(e.discountPercent || 0);
          setTaxType(e.taxType === 'INTER_STATE' ? 'INTER_STATE' : 'INTRA_STATE');

          // Installation & Freight
          setInstallationType(e.installationType || 'PERCENTAGE');
          setInstallationRate(e.installationRate || 5.0);
          setManualInstallationAmount(e.installationAmount || 0);

          setFreightType(e.freightType || 'PERCENTAGE');
          setFreightRate(e.freightRate || 3.0);
          setManualFreightAmount(e.freightAmount || 0);

          const loadedItems = (e.items || []).map((it: any) => ({
            productId: it.productId,
            productCode: it.productCodeSnapshot,
            productName: it.productNameSnapshot,
            category: it.categorySnapshot,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            priceRuleId: it.priceRuleId,
            isManualPrice: it.isManualPrice || false,
            specifications: it.specificationsSnapshot,
            detailedSpecs: (it.itemSpecs || []).map((s: any) => ({
              code: s.specCode,
              name: s.specName,
              value: s.optionValue,
              label: s.optionLabel,
              price: s.price || 0,
            })),
          }));
          setItems(loadedItems);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [id]);

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

  const handleUpdate = async (status: 'DRAFT' | 'PENDING_APPROVAL') => {
    if (!companyName || !customerName || !phone || !address) {
      setErrorMessage('Please fill in Customer Details.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Please add at least one product.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        companyName,
        customerName,
        contactPerson,
        phone,
        email,
        address,
        gstin,
        state,
        referenceNumber,
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

      const res = await fetch(`/api/estimations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update estimation');
      }

      router.push(`/estimations/${id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while updating.');
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <span className="text-xs font-mono">Loading Estimation #{estimationNumber}...</span>
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
              EDIT ESTIMATION
            </span>
            <span className="text-xs text-slate-400 font-mono">#{estimationNumber}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900">Modify Estimation</h1>
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
            onClick={() => handleUpdate('DRAFT')}
            className="px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleUpdate('PENDING_APPROVAL')}
            className={`px-4 py-2 rounded-lg text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 ${
              currentStatus === 'REVISION_REQUESTED'
                ? 'bg-amber-600 hover:bg-amber-700'
                : currentUser?.role === 'ADMIN'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
            <span>
              {currentStatus === 'REVISION_REQUESTED'
                ? 'Resubmit for Admin Approval'
                : currentUser?.role === 'ADMIN'
                ? 'Save & Approve Changes'
                : 'Submit for Admin Approval'}
            </span>
          </button>
        </div>
      </div>

      {/* Revision Requested Callout Banner */}
      {currentStatus === 'REVISION_REQUESTED' && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/60 to-orange-50 border-2 border-amber-400 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <RotateCcw className="w-5 h-5 text-amber-900" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-300">
                  Revision Requested by Admin
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-2">
                Management Instructions / Reason for Revision:
              </p>
              <div className="mt-1.5 p-3 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-950 shadow-sm leading-relaxed">
                &ldquo;{approvalRemarks || 'Please update the requested specifications and prices accordingly.'}&rdquo;
              </div>
              <p className="text-[11px] text-amber-800 mt-2 font-medium">
                Make your changes to the customer details, products, specifications, or pricing below, then click{' '}
                <strong className="underline decoration-amber-500 font-bold">&quot;Resubmit for Admin Approval&quot;</strong> to return this quotation to management review.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Financial Summary Card */}
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