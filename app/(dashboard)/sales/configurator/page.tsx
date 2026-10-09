'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatINR, numberToIndianWords } from '@/lib/utils';
import {
  SlidersHorizontal,
  Boxes,
  Check,
  Zap,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Download,
  Building2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Phone,
  MapPin,
  Calendar,
  Layers,
  Info,
  X,
  Search,
  Eye,
  RefreshCw,
  FileDown,
  Clock,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  Send,
  Mail,
  Share2,
} from 'lucide-react';
import * as xlsx from 'xlsx';
import { PanelVisualSilhouette } from '@/components/products/PanelVisualSilhouette';
import { BrandComparisonModal } from '@/components/products/BrandComparisonModal';

interface VariantOption {
  id: string;
  optionName: string;
  isDefault: boolean;
  priceDelta: number;
  description: string | null;
}

interface VariantDimension {
  id: string;
  dimensionName: string;
  displayOrder: number;
  options: VariantOption[];
}

interface FinishedGood {
  id: string;
  modelNumber: string;
  name: string;
  categoryId: string;
  category: { id: string; name: string };
  description: string | null;
  enclosureHeight: number | null;
  enclosureWidth: number | null;
  enclosureDepth: number | null;
  ipRating: string | null;
  formRating: string | null;
  bomMaterialCost: number;
  fabricationCost: number;
  busbarCost: number;
  wiringCost: number;
  netManufacturingCost: number;
  finalExWorksPrice: number;
  gstAmount: number;
  finalGrossPrice: number;
  variants: VariantDimension[];
  bomItems: any[];
}

export default function SalesConfiguratorPage() {
  const searchParams = useSearchParams();
  const preselectedModelId = searchParams.get('modelId');

  const [models, setModels] = useState<FinishedGood[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Selected variant options: Map of dimensionId -> optionId
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Expandable BOM drawer
  const [showBomDrawer, setShowBomDrawer] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Active Navigation Tab: 'configurator' | 'history'
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'configurator' | 'history'>(
    tabParam === 'history' ? 'history' : 'configurator'
  );

  // Recent Estimations History State
  const [historyEstimations, setHistoryEstimations] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);

  // Sync activeTab with URL query parameter
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'history') {
      setActiveTab('history');
    } else if (t === 'configurator') {
      setActiveTab('configurator');
    }
  }, [searchParams]);

  const switchTab = (tab: 'configurator' | 'history') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const q = new URLSearchParams({
        search: historySearch,
        status: historyStatusFilter,
        page: String(historyPage),
        limit: '12',
      });
      const res = await fetch(`/api/estimations?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryEstimations(data.estimations || []);
        setHistoryTotalPages(data.pagination?.totalPages || 1);
        setHistoryTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load estimations history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [historySearch, historyStatusFilter, historyPage]);

  const historyStats = useMemo(() => {
    const totalAmount = historyEstimations.reduce((sum, e) => sum + (e.grandTotal || 0), 0);
    const pdfCount = historyEstimations.filter(
      (e) => e.status === 'PDF_GENERATED' || e.status === 'FINALIZED' || e.status === 'APPROVED'
    ).length;
    return {
      totalCount: historyTotalCount,
      totalAmount,
      pdfCount,
    };
  }, [historyEstimations, historyTotalCount]);

  // Fetch Finished Goods
  const [refreshingVariants, setRefreshingVariants] = useState(false);

  const fetchFinishedGoods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finished-goods', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load finished goods');
      const data = await res.json();
      const list: FinishedGood[] = data.finishedGoods || [];
      setModels(list);

      const cats = Array.from(new Set(list.map((m) => m.category?.name).filter(Boolean)));
      setCategories(cats);

      if (list.length > 0 && !selectedModelId) {
        const initialId = preselectedModelId && list.some((m) => m.id === preselectedModelId)
          ? preselectedModelId
          : list[0]?.id || '';
        setSelectedModelId(initialId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishedGoods();
  }, [preselectedModelId]);

  // Manual Refresh of live catalog and variants
  const handleManualRefresh = async () => {
    try {
      setRefreshingVariants(true);
      const res = await fetch('/api/finished-goods', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const list: FinishedGood[] = data.finishedGoods || [];
        setModels(list);
      }
      if (selectedModelId) {
        const varRes = await fetch(`/api/finished-goods/${selectedModelId}/variants`, { cache: 'no-store' });
        if (varRes.ok) {
          const varData = await varRes.json();
          if (Array.isArray(varData.variants)) {
            setModels((prev) =>
              prev.map((m) => (m.id === selectedModelId ? { ...m, variants: varData.variants } : m))
            );
          }
        }
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setTimeout(() => setRefreshingVariants(false), 500);
    }
  };

  // Reset selected model if it is not in the filtered category
  useEffect(() => {
    if (selectedModelId && !filteredModels.some((m) => m.id === selectedModelId)) {
      setSelectedModelId('');
    }
  }, [selectedCategory]);

  // Current Selected Model
  const currentModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  // When model changes, initialize defaults while preserving any valid selections
  useEffect(() => {
    if (!currentModel) return;
    setSelectedOptions((prev) => {
      const next: Record<string, string> = {};
      (currentModel.variants || []).forEach((dim) => {
        const existingOptId = prev[dim.id];
        const exists = (dim.options || []).some((o) => o.id === existingOptId);
        if (exists && existingOptId) {
          next[dim.id] = existingOptId;
        } else {
          const defaultOpt = (dim.options || []).find((o) => o.isDefault) || dim.options[0];
          if (defaultOpt && defaultOpt.id) {
            next[dim.id] = defaultOpt.id;
          }
        }
      });
      return next;
    });
  }, [currentModel]);

  // Dynamic variant fetch whenever model is selected to ensure real-time sync with Panel Upgradations
  useEffect(() => {
    if (!selectedModelId) return;
    async function refreshVariants() {
      try {
        const res = await fetch(`/api/finished-goods/${selectedModelId}/variants`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.variants)) {
            setModels((prev) =>
              prev.map((m) => (m.id === selectedModelId ? { ...m, variants: data.variants } : m))
            );
          }
        }
      } catch (err) {
        console.error('Failed to refresh variants for selected model:', err);
      }
    }
    refreshVariants();
  }, [selectedModelId]);

  // Filtered model list by category
  const filteredModels = useMemo(() => {
    if (selectedCategory === 'ALL') return models;
    return models.filter((m) => m.category?.name === selectedCategory);
  }, [models, selectedCategory]);

  // Calculate Real-Time Price & Breakdown with guaranteed fallback to default options
  const { totalDelta, netExWorks, gst18, totalProposalPrice, selectedBreakdown } = useMemo(() => {
    if (!currentModel) {
      return { totalDelta: 0, netExWorks: 0, gst18: 0, totalProposalPrice: 0, selectedBreakdown: [] };
    }

    let deltaSum = 0;
    const breakdown: {
      dimension: string;
      dimensionName: string;
      option: string;
      selectedOptionName: string;
      delta: number;
      priceDelta: number;
    }[] = [];

    (currentModel.variants || []).forEach((dim) => {
      const selectedOptId = selectedOptions[dim.id];
      const opt =
        (dim.options || []).find((o) => o.id === selectedOptId) ||
        (dim.options || []).find((o) => o.isDefault) ||
        (dim.options || [])[0];

      if (opt) {
        const d = Number(opt.priceDelta) || 0;
        deltaSum += d;
        breakdown.push({
          dimension: dim.dimensionName,
          dimensionName: dim.dimensionName,
          option: opt.optionName,
          selectedOptionName: opt.optionName,
          delta: d,
          priceDelta: d,
        });
      }
    });

    const net = Math.max(0, currentModel.finalExWorksPrice + deltaSum);
    const gst = Math.round(net * 0.18);
    const gross = net + gst;

    return {
      totalDelta: deltaSum,
      netExWorks: net,
      gst18: gst,
      totalProposalPrice: gross,
      selectedBreakdown: breakdown,
    };
  }, [currentModel, selectedOptions]);

  // Handle Option Click
  const handleSelectOption = (dimensionId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [dimensionId]: optionId,
    }));
  };

  // Export Estimation Excel with 2 Sheets: "Estimation" and "BOM Details" (NO Customer Info, NO Payment Terms)
  const handleDownloadExcelQuote = () => {
    if (!currentModel) return;

    // -----------------------------------------------------------------------
    // SHEET 1: ESTIMATION (Company Details, Product Specs, Upgrades, Commercial Summary & Tax)
    // -----------------------------------------------------------------------
    const estData: any[][] = [
      ['SVG ELECTRIC & CONTROL PRODUCTS'],
      ['Engineers & Manufacturers of Industrial Power Panels, Motor Control Centers & Automation Systems'],
      ['# 1/22 Perumal Kovil Street, Barur (Po), Pochampalli (Tk), Krishnagiri (Dt) - 635201, Tamil Nadu, India.'],
      ['Phone: +91 88707 19804 / +91 63827 92780 | Email: sales@svgelectric.com | Web: www.svgelectric.com'],
      ['GSTIN: 33AAAFS1234F1ZP | ISO 9001:2015 Certified Enclosure Fabrication & Assembly Facility'],
      [],
      ['COMMERCIAL ESTIMATION & SPECIFICATION SUMMARY'],
      ['Estimation Reference:', `SVG/EST/${currentModel.modelNumber}/${new Date().getFullYear()}`],
      ['Estimation Date:', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
      [],
      ['--- PANEL ESTIMATION & TECHNICAL PROFILE ---'],
      ['Model Number:', currentModel.modelNumber],
      ['Product Name:', currentModel.name],
      ['Product Category:', (typeof currentModel.category === 'object' && currentModel.category?.name) ? currentModel.category.name : (typeof currentModel.category === 'string' ? currentModel.category : 'Power Control Switchboard')],
      ['Description:', currentModel.description || 'Standard Industrial Control Panel'],
      ['Enclosure Dimensions:', `${currentModel.enclosureHeight || 0}mm (H) × ${currentModel.enclosureWidth || 0}mm (W) × ${currentModel.enclosureDepth || 0}mm (D)`],
      ['Ingress Protection:', currentModel.ipRating || 'IP54'],
      ['Form of Separation:', currentModel.formRating || 'Form 4B as per IEC 61439-1/2'],
      ['Construction Spec:', '2.0mm Heavy-Duty CRCA Steel, RAL 7032/7035 Powder Coated'],
      ['Commercial Basis:', 'Ex-Works Barur'],
      [],
      ['--- CONFIGURED UPGRADE VARIANTS & SPECIFICATIONS ---'],
      ['#', 'Subsystem / Upgrade Dimension', 'Selected Configuration Option', 'Price Impact (INR)'],
    ];

    if (selectedBreakdown.length > 0) {
      selectedBreakdown.forEach((b, idx) => {
        estData.push([
          idx + 1,
          b.dimension,
          b.option,
          b.delta === 0 ? 'Standard Baseline (Included)' : `+ ₹${b.delta.toLocaleString('en-IN')}`,
        ]);
      });
    } else {
      estData.push([1, 'Standard Model Configuration', 'Factory Default Technical Baseline', 'Included in Base']);
    }

    estData.push([]);
    estData.push(['--- COMMERCIAL PRICE SUMMARY & TAX DETAILS ---']);
    estData.push(['Base Model Ex-Works Price:', `₹${currentModel.finalExWorksPrice.toLocaleString('en-IN')}`]);
    estData.push(['Configured Upgrades Net Delta:', totalDelta === 0 ? '₹0' : `${totalDelta > 0 ? '+' : ''}₹${totalDelta.toLocaleString('en-IN')}`]);
    estData.push(['Net Ex-Works Selling Price:', `₹${netExWorks.toLocaleString('en-IN')}`]);
    estData.push(['Central GST (CGST 9%):', `₹${Math.round(gst18 / 2).toLocaleString('en-IN')}`]);
    estData.push(['State GST (SGST 9%):', `₹${Math.round(gst18 / 2).toLocaleString('en-IN')}`]);
    estData.push(['Total Goods & Services Tax (GST 18%):', `₹${gst18.toLocaleString('en-IN')}`]);
    estData.push(['TOTAL ESTIMATION VALUE (INR):', `₹${totalProposalPrice.toLocaleString('en-IN')}`]);
    estData.push(['Amount in Words:', numberToIndianWords(totalProposalPrice)]);
    estData.push([]);
    estData.push(['--- COMMERCIAL CONDITIONS ---']);
    estData.push(['1. Delivery Period: 4 to 6 weeks from receipt of technically & commercially clear purchase order.']);
    estData.push(['2. Warranty: 12 months from commissioning or 18 months from supply against manufacturing defects.']);
    estData.push(['3. Estimation Validity: Valid for 30 calendar days from the date of issue.']);
    estData.push(['4. Taxes & Duties: Goods & Services Tax (GST 18%) charged as per statutory requirement.']);

    const wsEst = xlsx.utils.aoa_to_sheet(estData);
    wsEst['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 45 }, { wch: 25 }];

    // -----------------------------------------------------------------------
    // SHEET 2: BOM DETAILS (Bill of Materials Items Breakdown)
    // -----------------------------------------------------------------------
    const bomData: any[][] = [
      ['SVG ELECTRIC & CONTROL PRODUCTS — BILL OF MATERIALS (BOM) BREAKDOWN'],
      ['Panel Model:', currentModel.modelNumber, 'Product Name:', currentModel.name],
      ['Enclosure Dimensions:', `${currentModel.enclosureHeight || 0}mm (H) × ${currentModel.enclosureWidth || 0}mm (W) × ${currentModel.enclosureDepth || 0}mm (D)`, 'Protection / Form:', `${currentModel.ipRating || 'IP54'} / ${currentModel.formRating || 'Form 4B'}`],
      [],
      ['#', 'Section / Sub-Assembly', 'Material Description', 'Rating / Specification', 'Make / Brand', 'Quantity', 'Unit', 'Unit Rate (INR)', 'Total Line Cost (INR)'],
    ];

    const bomItems = Array.isArray(currentModel.bomItems) ? currentModel.bomItems : [];
    let bomTotalAmount = 0;

    if (bomItems.length > 0) {
      bomItems.forEach((b: any, idx: number) => {
        const qty = Number(b.quantity) || 1;
        const unit = b.unit || 'Nos';
        const uRate = Number(b.unitPrice) || Number(b.unitCost) || 0;
        const lineCost = Number(b.totalAmount) || Number(b.totalCost) || (qty * uRate);
        bomTotalAmount += lineCost;

        bomData.push([
          b.sNo || idx + 1,
          b.sectionName || b.category || 'Main Panel',
          b.description || b.itemName || 'Switchgear / Component',
          b.rating || b.specification || '-',
          b.make || b.brand || 'Standard',
          qty,
          unit,
          `₹${uRate.toLocaleString('en-IN')}`,
          `₹${lineCost.toLocaleString('en-IN')}`,
        ]);
      });
    } else {
      const baseBomCost = Number(currentModel.bomMaterialCost) || Number(currentModel.finalExWorksPrice) || 0;
      bomTotalAmount = baseBomCost;
      bomData.push([
        1,
        'Main Panel Assembly',
        'Standard Electrical Switchgear & Components',
        '-',
        'Standard',
        1,
        'Set',
        `₹${baseBomCost.toLocaleString('en-IN')}`,
        `₹${baseBomCost.toLocaleString('en-IN')}`,
      ]);
    }

    bomData.push([]);
    bomData.push(['--- TOTAL BOM VALUATION SUMMARY ---']);
    bomData.push(['Total BOM Materials Count:', `${bomItems.length} Items`]);
    bomData.push(['Total BOM Material Valuation:', `₹${bomTotalAmount.toLocaleString('en-IN')}`]);
    bomData.push([]);
    bomData.push(['Certification Note: This Bill of Materials is extracted from the SVG Electric Central Engineering Master.']);

    const wsBom = xlsx.utils.aoa_to_sheet(bomData);
    wsBom['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 42 },
      { wch: 25 },
      { wch: 18 },
      { wch: 10 },
      { wch: 8 },
      { wch: 18 },
      { wch: 20 },
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, wsEst, 'Estimation');
    xlsx.utils.book_append_sheet(wb, wsBom, 'BOM Details');
    xlsx.writeFile(wb, `SVG_Estimation_${currentModel.modelNumber}.xlsx`);
  };

  // Export Proposal PDF (2-Page Formal PDF: Page 1 Estimation Details, Page 2 Product & BOM Details, No Payment Terms)
  const handleDownloadPdfQuote = async () => {
    if (!currentModel) return;
    try {
      setDownloadingPdf(true);
      const res = await fetch('/api/finished-goods/proposal-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentModel,
          selectedBreakdown,
          totalDelta,
          netExWorks,
          gst18,
          totalProposalPrice,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to generate PDF' }));
        throw new Error(err.error || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const downloadFilename = filenameMatch
        ? filenameMatch[1]
        : `SVG_Estimation_${currentModel.modelNumber}.pdf`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Error exporting PDF estimation');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getSummaryShareText = () => {
    if (!currentModel) return '';
    const catName = typeof currentModel.category === 'object' && currentModel.category?.name
      ? currentModel.category.name
      : (typeof currentModel.category === 'string' ? currentModel.category : 'Power Control Switchboard');

    return [
      `*SVG ELECTRIC & CONTROL PRODUCTS*`,
      `*Commercial Estimation Summary*`,
      `---------------------------------`,
      `*Model Number:* ${currentModel.modelNumber}`,
      `*Product:* ${currentModel.name}`,
      `*Category:* ${catName}`,
      `*Enclosure:* ${currentModel.enclosureHeight || 0}H × ${currentModel.enclosureWidth || 0}W × ${currentModel.enclosureDepth || 0}D mm`,
      `*Protection:* ${currentModel.ipRating || 'IP54'} | ${currentModel.formRating || 'Form 2B'}`,
      `*Base Ex-Works:* ₹${currentModel.finalExWorksPrice.toLocaleString('en-IN')}`,
      `*Configured Delta:* ${totalDelta >= 0 ? '+' : ''}₹${totalDelta.toLocaleString('en-IN')}`,
      `*Net Ex-Works:* ₹${netExWorks.toLocaleString('en-IN')}`,
      `*GST (18%):* ₹${gst18.toLocaleString('en-IN')}`,
      `*TOTAL ESTIMATION:* ₹${totalProposalPrice.toLocaleString('en-IN')}`,
      `---------------------------------`,
      `*Validity:* 30 Days from issue`,
      `*Delivery:* 4 to 6 weeks from PO clearance`,
      `*SVG Electric Contact:* +91 88707 19804 / sales@svgelectric.com`,
    ].join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = getSummaryShareText();
    if (!text) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    if (!currentModel) return;
    const subject = encodeURIComponent(`Commercial Estimation: ${currentModel.modelNumber} - ${currentModel.name}`);
    const body = encodeURIComponent(getSummaryShareText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopySummary = async () => {
    const text = getSummaryShareText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            <Search className="w-4 h-4" />
            <span>Interactive Sales Configurator & Upgrades</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            {activeTab === 'configurator' ? 'Search Products & Variants' : 'Recent Estimations'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'configurator'
              ? 'Search and configure industrial switchboards with live variants. Select brand makes, busbars, automation tiers, and cloud gateways with instant dynamic pricing.'
              : 'List of estimations recently created with complete technical and commercial details.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'configurator' && (
            <button
              onClick={() => switchTab('history')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Recent Estimations &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => switchTab('configurator')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'configurator'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search Products & Variants</span>
        </button>

        <button
          onClick={() => switchTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Recent Estimations</span>
          {historyTotalCount > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'history' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {historyTotalCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'configurator' ? (
        <>

      {/* Model Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Categories ({models.length} Models)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Variants Button */}
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshingVariants}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-slate-200 shrink-0"
          title="Reload latest variants published from Panel Upgradations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshingVariants ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">{refreshingVariants ? 'Syncing...' : 'Refresh Variants'}</span>
        </button>

        {/* Model Dropdown Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:justify-end">
          <span className="text-xs font-bold text-slate-500 font-mono uppercase whitespace-nowrap">Select Model:</span>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full md:w-96 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">-- Select a Model ({filteredModels.length} available) --</option>
            {filteredModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.modelNumber} &bull; {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading panel upgradations...</p>
        </div>
      ) : !currentModel ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <SlidersHorizontal className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800">Select a Panel Model</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            Please choose an electrical panel model from the dropdown above to view base technical specifications, configure make & component upgrades, and generate real-time commercial estimations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT 2 COLUMNS: INTERACTIVE UPGRADE VARIANTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {currentModel.modelNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-medium font-mono">
                      Category: {currentModel.category?.name}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{currentModel.name}</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{currentModel.description}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Base Ex-Works</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ₹{currentModel.finalExWorksPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Physical Specifications Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">ENCLOSURE SIZE</span>
                  <strong className="text-slate-800">
                    {currentModel.enclosureHeight}×{currentModel.enclosureWidth}×{currentModel.enclosureDepth} mm
                  </strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">INGRESS PROTECTION</span>
                  <strong className="text-slate-800">{currentModel.ipRating || 'IP54'}</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">FORM FACTOR</span>
                  <strong className="text-slate-800">{currentModel.formRating || 'Form 2B'}</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">BOM DENSITY</span>
                  <strong className="text-slate-800">{currentModel.bomItems?.length || 0} Materials</strong>
                </div>
              </div>
            </div>

            {/* 2D GA Dimensional Enclosure Silhouette Visualizer */}
            <PanelVisualSilhouette
              height={currentModel.enclosureHeight}
              width={currentModel.enclosureWidth}
              depth={currentModel.enclosureDepth}
              ipRating={currentModel.ipRating}
              formRating={currentModel.formRating}
              modelNumber={currentModel.modelNumber}
              modelName={currentModel.name}
              categoryName={
                typeof currentModel.category === 'object' && currentModel.category?.name
                  ? currentModel.category.name
                  : (typeof currentModel.category === 'string' ? currentModel.category : 'Power Control Switchboard')
              }
            />

            {/* VARIANT DIMENSIONS PILLS SELECTION */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-blue-600" />
                    <span>Technical Variant Matrix & Option Cost Variances</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Select technical option to evaluate commercial variance</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowComparisonModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 self-start sm:self-auto"
                  title="Compare Schneider Electric, ABB, L&T, Siemens pricing side-by-side"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Compare Switchgear Makes</span>
                </button>
              </div>

              {(!currentModel.variants || currentModel.variants.length === 0) ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                    <SlidersHorizontal className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Custom Variants Configured for this Model</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    This panel model is currently priced at factory baseline specification without add-on variant subsystems.
                  </p>
                  <Link
                    href={`/admin/panel-upgradations?modelId=${currentModel.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors mt-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Configure Variants in Panel Upgradations</span>
                  </Link>
                </div>
              ) : (
                (currentModel.variants || []).map((dim, dIdx) => (
                  <div key={dim.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 tracking-wide font-mono uppercase">
                        {dIdx + 1}. {dim.dimensionName}
                      </span>
                      <span className="text-[11px] text-slate-400">Select 1 option</span>
                    </div>

                    {/* Pills Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {dim.options.map((opt) => {
                        const isSelected = selectedOptions[dim.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelectOption(dim.id, opt.id)}
                            className={`p-3 rounded-xl text-left border transition-all relative ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-600 shadow-sm shadow-blue-600/10'
                                : 'bg-slate-50/60 hover:bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 leading-tight">
                                {opt.optionName}
                              </span>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            {opt.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{opt.description}</p>
                            )}

                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between font-mono text-[11px]">
                              <span className="text-slate-400 font-medium">Price Delta:</span>
                              <span
                                className={`font-bold ${
                                  opt.priceDelta > 0
                                    ? 'text-amber-700'
                                    : opt.priceDelta < 0
                                    ? 'text-emerald-700'
                                    : 'text-slate-500'
                                }`}
                              >
                                {opt.priceDelta === 0
                                  ? 'Standard (Base)'
                                  : `${opt.priceDelta > 0 ? '+' : ''}₹${opt.priceDelta.toLocaleString('en-IN')}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Expandable Full BOM View */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowBomDrawer(!showBomDrawer)}
                className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-800 font-mono uppercase"
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  <span>Master Bill of Materials (BOM) Itemization ({currentModel.bomItems?.length || 0} Items)</span>
                </div>
                {showBomDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showBomDrawer && (
                <div className="p-4 overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">S.No</th>
                        <th className="py-2 px-3">Section</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Rating</th>
                        <th className="py-2 px-3">Make</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {(currentModel.bomItems || []).map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-500">{it.sNo || idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-600">{it.sectionName}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.description}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{it.rating || '-'}</td>
                          <td className="py-2 px-3 font-bold text-slate-700">{it.make}</td>
                          <td className="py-2 px-2 text-center font-mono">{it.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{it.unitPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COLUMN: REAL-TIME PRICING DISCOVERY & QUOTATION CARD */}
          <div className="space-y-6 sticky top-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                    COMMERCIAL VALUATION MATRIX
                  </span>
                  <h3 className="text-base font-bold text-white">Commercial Estimation Summary</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-emerald-400" />
                </div>
              </div>

              {/* Net Commercial Price Summary */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-mono uppercase">Net Estimation Value (Ex-Works + GST)</span>
                <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  ₹{totalProposalPrice.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-400">Inclusive of 18% GST (CGST 9% + SGST 9%)</p>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Base Model Ex-Works:</span>
                  <span>₹{currentModel.finalExWorksPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Selected Upgrades Delta:</span>
                  <span className={totalDelta > 0 ? 'text-amber-400 font-bold' : totalDelta < 0 ? 'text-emerald-400 font-bold' : ''}>
                    {totalDelta === 0 ? '₹0' : `${totalDelta > 0 ? '+' : ''}₹${totalDelta.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1.5">
                  <span>Net Ex-Works Selling:</span>
                  <span>₹{netExWorks.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>GST 18% (Tax):</span>
                  <span>₹{gst18.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Selected Options Summary List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">Configured Upgrades:</span>
                  <span className="text-[10px] font-mono text-slate-500">{selectedBreakdown.length} active</span>
                </div>
                <div className="space-y-2 text-xs">
                  {selectedBreakdown.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic py-1">Factory Baseline (No add-on variants)</div>
                  ) : (
                    selectedBreakdown.map((b, i) => (
                      <div key={i} className="flex items-start justify-between text-[11px] text-slate-300 gap-2 pb-1.5 border-b border-slate-800/60 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-blue-400 font-mono block uppercase tracking-wide truncate">
                            {b.dimension}
                          </span>
                          <span className="font-medium text-slate-100 truncate block mt-0.5">
                            {b.option}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400 flex-shrink-0 pt-0.5 font-bold">
                          {b.delta === 0 ? 'Standard' : `${b.delta > 0 ? '+' : ''}₹${b.delta.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons: Download PDF, Excel, WhatsApp, Email */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleDownloadPdfQuote}
                  disabled={downloadingPdf}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  title="Download 2-Page Formal Estimation & BOM PDF"
                >
                  {downloadingPdf ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{downloadingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
                </button>

                <button
                  onClick={handleDownloadExcelQuote}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                  title="Download 2-Sheet Estimation & BOM Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download as Excel</span>
                </button>

                {/* Instant Share Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="py-2.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    title="Share Estimation Summary via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareEmail}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                    title="Share Estimation Summary via Email"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-300" />
                    <span>Email</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied Summary to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Estimation Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
                SVG Electric &bull; Barur, Krishnagiri &bull; ISO 9001:2015
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand / Make Comparison Modal */}
      <BrandComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        currentModel={currentModel}
        selectedOptions={selectedOptions}
        onApplyOptions={(newOpts) => setSelectedOptions((prev) => ({ ...prev, ...newOpts }))}
      />
        </>
      ) : (
        /* ========================================================================= */
        /* RECENT ESTIMATIONS VIEW                                                   */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Recent Estimations Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-mono uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Recently Created Estimations</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                List of estimations recently generated with real-time status and PDF downloads.
              </p>
            </div>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              title="Refresh List"
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* History Estimations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Estimation No.</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer & Company</th>
                    <th className="px-4 py-3">Model / Description</th>
                    <th className="px-4 py-3 text-right">Grand Total (INR)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500">
                        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span className="font-medium text-xs">Loading recent estimations history...</span>
                      </td>
                    </tr>
                  ) : historyEstimations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                        <p className="font-bold text-slate-700 text-sm">No estimations found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Recent estimations will appear here as they are generated.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    historyEstimations.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                          <Link href={`/estimations/${est.id}`} className="hover:underline flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>{est.estimationNumber}</span>
                          </Link>
                          {est.referenceNumber && (
                            <p className="text-[10px] text-slate-400 font-sans truncate font-normal mt-0.5">
                              {est.referenceNumber}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{format(new Date(est.date), 'dd-MMM-yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 truncate max-w-[220px]">
                            {est.companyName || est.customerName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            Attn: {est.customerName} {est.phone ? `• ${est.phone}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-slate-700 truncate font-medium">
                            {est.remarks || est.items?.[0]?.productNameSnapshot || 'Custom Industrial Control Panel'}
                          </p>
                          {est.items?.[0]?.productCodeSnapshot && (
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              Model: {est.items[0].productCodeSnapshot}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          <div>{formatINR(est.grandTotal)}</div>
                          <span className="text-[10px] font-normal text-slate-400">
                            (Net: {formatINR(est.subtotal)})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                              est.status === 'APPROVED' || est.status === 'FINALIZED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : est.status === 'PDF_GENERATED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : est.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : est.status === 'REVISION_REQUESTED'
                                ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold'
                                : est.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {est.status === 'PDF_GENERATED' ? (
                              <>
                                <FileDown className="w-3 h-3 text-blue-600" />
                                <span>ESTIMATION GENERATED</span>
                              </>
                            ) : est.status === 'APPROVED' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>APPROVED</span>
                              </>
                            ) : est.status === 'PENDING_APPROVAL' ? (
                              'PENDING APPROVAL'
                            ) : est.status === 'REVISION_REQUESTED' ? (
                              'REVISION'
                            ) : (
                              est.status
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/api/estimations/${est.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download PDF Estimation"
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-semibold border border-blue-200 hover:border-blue-600 transition-all flex items-center gap-1"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>

                            <Link
                              href={`/estimations/${est.id}`}
                              title="View Estimation Details"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono">
                Showing {historyEstimations.length} of {historyTotalCount} total estimation records
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-semibold px-2">
                  Page {historyPage} of {historyTotalPages || 1}
                </span>
                <button
                  onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                  disabled={historyPage >= historyTotalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
