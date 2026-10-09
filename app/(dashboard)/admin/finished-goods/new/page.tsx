'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes,
  Layers,
  Upload,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Calculator,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Info,
  HelpCircle,
  Copy,
  RefreshCw,
  Search,
  X,
  ShieldCheck,
  Zap,
  Pencil,
  Edit3,
  Filter,
  Check,
  RotateCcw,
  FileText,
  Settings2,
} from 'lucide-react';

interface BomItem {
  id: string;
  sectionName: string;
  sNo: number;
  description: string;
  rating: string;
  typeCode: string;
  make: string;
  unit: string;
  quantity: number;
  listPrice?: number;
  unitPrice: number | null; // null if unmapped!
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  isMapped?: boolean;
  category?: string;
}

interface VariantOption {
  optionName: string;
  isDefault: boolean;
  priceDelta: number;
  description: string;
}

interface VariantDimension {
  dimensionName: string;
  options: VariantOption[];
}

const CATEGORY_SECTION_MAP: Record<string, string[]> = {
  'CAT-MCC': ['Motor Control', 'Motor Protection', 'Protection / MCCB', 'Protection / MCB', 'Wiring', 'Busbar / Power Distribution'],
  'CAT-PLC': ['PLC CPU', 'PLC I/O', 'PLC Communication', 'HMI', 'Industrial Networking', 'Power Supply', 'Control Relays'],
  'CAT-APFC': ['APFC', 'Protection / MCCB', 'Busbar / Power Distribution', 'Metering'],
  'CAT-ACD': ['VFD / AC Drive', 'VFD Accessories', 'Protection / MCCB', 'Power Cable', 'Cooling / Ventilation'],
  'CAT-DCD': ['Motor Control', 'Protection / Fuses', 'Protection / MCCB', 'Busbar / Power Distribution', 'Control Relays'],
  'CAT-PCC': ['PCC / ACB', 'Metering / CT', 'Metering', 'Busbar / Power Distribution', 'Surge Protection'],
  'CAT-MET': ['Metering', 'Metering / CT', 'Protection / MCB', 'Wiring'],
  'CAT-CHG': ['AMF / Changeover', 'Protection / MCCB', 'Control Relays', 'Power Supply'],
  'CAT-DIST': ['Protection / MCCB', 'Protection / MCB', 'Isolators / Switches', 'Busbar / Power Distribution'],
};

export default function NewFinishedGoodPage() {
  const router = useRouter();

  // Active Wizard Tab (1: Specs, 2: BOM, 3: 4-Costing Stages, 4: Commercial Review & Save)
  const [activeTab, setActiveTab] = useState<'SPECS' | 'BOM' | 'STAGES' | 'REVIEW'>('SPECS');

  const goToTab = (tab: 'SPECS' | 'BOM' | 'STAGES' | 'REVIEW') => {
    setActiveTab(tab);
    if (typeof document !== 'undefined') {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: 'instant' });
      }
      window.scrollTo(0, 0);
    }
  };

  // Ensure top of page is scrolled into view immediately whenever active stage tab changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const performScroll = () => {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
        mainEl.scrollTo({ top: 0, behavior: 'instant' });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    performScroll();
    const rafId = requestAnimationFrame(performScroll);
    const timer = setTimeout(performScroll, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [activeTab]);

  // Categories & Existing models for cloning
  const [categories, setCategories] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [existingModels, setExistingModels] = useState<any[]>([]);

  // Step 1: Basic Information
  const [modelNumber, setModelNumber] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [enclosureHeight, setEnclosureHeight] = useState('2000');
  const [enclosureWidth, setEnclosureWidth] = useState('1000');
  const [enclosureDepth, setEnclosureDepth] = useState('600');
  const [ipRating, setIpRating] = useState('IP54');
  const [formRating, setFormRating] = useState('Form 2B');

  // Step 2: BOM Items State
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [activeSection, setActiveSection] = useState('Main Control Panel');
  const [newSectionName, setNewSectionName] = useState('');
  const [bomSearch, setBomSearch] = useState('');

  // Step 2: Cascade RM Selection States: RM Category -> RM Name (Typeahead) -> Brand -> Variant
  const [cascadeRmCategory, setCascadeRmCategory] = useState('ALL');
  const [cascadeRmQuery, setCascadeRmQuery] = useState('');
  const [cascadeRmSuggestions, setCascadeRmSuggestions] = useState<any[]>([]);
  const [isSearchingRm, setIsSearchingRm] = useState(false);
  const [showCascadeRmDropdown, setShowCascadeRmDropdown] = useState(false);
  const [selectedRmName, setSelectedRmName] = useState('');

  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [selectedComponent, setSelectedComponent] = useState<any | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputFinalPrice, setInputFinalPrice] = useState<number>(0);
  const [inputListPrice, setInputListPrice] = useState<number>(0);
  const [inputUnit, setInputUnit] = useState<string>('Nos');
  const [inputSection, setInputSection] = useState<string>('Main Incomer');

  // In-row typeahead state
  const [activeRowDropdownId, setActiveRowDropdownId] = useState<string | null>(null);
  const [rowSearchQuery, setRowSearchQuery] = useState('');
  const [rowSuggestions, setRowSuggestions] = useState<any[]>([]);
  const [isRowSearching, setIsRowSearching] = useState(false);

  // Step 3: 4 Costing Stages & Formula Parameters (Admin Editable)
  // Stage 1: Fabrication
  const [fabSheetGauge, setFabSheetGauge] = useState('14 Gauge (2.0mm)');
  const [fabPowderCoatingRate, setFabPowderCoatingRate] = useState('450'); // per m2
  const [fabComplexityFactor, setFabComplexityFactor] = useState('1.6');
  const [fabSheetMultiplier, setFabSheetMultiplier] = useState<number>(4.2);
  const [fabPlinthGlandCost, setFabPlinthGlandCost] = useState<number>(9000);
  const [fabLocksGasketCost, setFabLocksGasketCost] = useState<number>(6000);
  const [editingFabFormula, setEditingFabFormula] = useState(false);
  const [fabManualOverride, setFabManualOverride] = useState<string>('75000');

  // Stage 2: Busbar System
  const [busbarAmps, setBusbarAmps] = useState('680');
  const [busbarMaterial, setBusbarMaterial] = useState<'ALUMINUM' | 'COPPER'>('ALUMINUM');
  const [busbarCurrentDensity, setBusbarCurrentDensity] = useState('0.8'); // A/mm2
  const [busbarCommodityRate, setBusbarCommodityRate] = useState('380'); // INR/kg for Al, 950 for Cu
  const [busbarRunLength, setBusbarRunLength] = useState<number>(12); // meters
  const [busbarSleevesCost, setBusbarSleevesCost] = useState<number>(18000);
  const [busbarLaborCost, setBusbarLaborCost] = useState<number>(8000);
  const [editingBusbarFormula, setEditingBusbarFormula] = useState(false);
  const [busbarManualOverride, setBusbarManualOverride] = useState<string>('51000');

  // Stage 3: Wiring
  const [wirePointsCount, setWirePointsCount] = useState('180');
  const [wireLaborRatePerPoint, setWireLaborRatePerPoint] = useState('35'); // INR/point
  const [wireMaterialsCost, setWireMaterialsCost] = useState('18700');
  const [wireComplexityFactor, setWireComplexityFactor] = useState<number>(1.0);
  const [editingWireFormula, setEditingWireFormula] = useState(false);
  const [wireManualOverride, setWireManualOverride] = useState<string>('25000');

  // Stage 4: Final Charges
  const [fatTestingPercent, setFatTestingPercent] = useState('2.0');
  const [designEngPercent, setDesignEngPercent] = useState('2.5');
  const [overheadPercent, setOverheadPercent] = useState('4.0');
  const [profitMarginPercent, setProfitMarginPercent] = useState('15.0');
  const [gstRatePercent, setGstRatePercent] = useState<number>(18.0);
  const [editingStage4Formula, setEditingStage4Formula] = useState(false);

  // Variants (configurator removed from costing)
  const [variants, setVariants] = useState<VariantDimension[]>([]);

  // Prompt Modal: "Shall I add to Price Master?"
  const [unmappedPrompt, setUnmappedPrompt] = useState<{
    show: boolean;
    item: BomItem | null;
    enteredPrice: number;
  }>({ show: false, item: null, enteredPrice: 0 });

  // Additional info drawer for Price Master save
  const [addMasterCategory, setAddMasterCategory] = useState('Switchgear & Protection');
  const [addMasterHsn, setAddMasterHsn] = useState('8537');

  // UI state
  const [savingFg, setSavingFg] = useState(false);
  const [uploadingBom, setUploadingBom] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // Helper: Get standardized prefix based on category
  const getCategoryPrefix = (catId: string, customCats = categories) => {
    const cat = customCats.find((c) => c.id === catId);
    const code = (cat?.code || '').toUpperCase();
    if (code.includes('MCC')) return 'SVG-MCC';
    if (code.includes('PLC')) return 'SVG-PLC';
    if (code.includes('APFC')) return 'SVG-APFC';
    if (code.includes('ACD')) return 'SVG-ACD';
    if (code.includes('DCD') || code.includes('DC')) return 'SVG-DC';
    if (code.includes('PCC')) return 'SVG-PCC';
    if (code.includes('MET')) return 'SVG-MET';
    if (code.includes('CHG')) return 'SVG-CHG';
    if (code.includes('DIST')) return 'SVG-DIST';
    if (cat?.name) {
      const slug = cat.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      return `SVG-${slug}`;
    }
    return 'SVG-PNL';
  };

  // Helper: Automated Model Number Generator (Format: SVG-[CATEGORY]-[YEAR]-[SEQUENCE])
  const generateAutomatedModelNumber = (
    targetCatId: string,
    customCats = categories,
    customExisting = existingModels
  ): string => {
    const cat = customCats.find((c) => c.id === targetCatId);
    const catCode = (cat?.code || 'CAT-PNL').replace('CAT-', '');
    const currentYear = new Date().getFullYear();
    const existingSet = new Set(customExisting.map((m) => (m.modelNumber || '').toUpperCase()));

    let seq = 1;
    let candidate = `SVG-${catCode}-${currentYear}-${String(seq).padStart(3, '0')}`;
    while (existingSet.has(candidate.toUpperCase())) {
      seq++;
      candidate = `SVG-${catCode}-${currentYear}-${String(seq).padStart(3, '0')}`;
    }
    return candidate;
  };

  const fetchGeneratedModelNumber = async (catId: string) => {
    if (!catId) return;
    try {
      const res = await fetch(`/api/finished-goods/generate-model-number?categoryId=${catId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.modelNumber) {
          setModelNumber(data.modelNumber);
          return;
        }
      }
    } catch (err) {
      console.warn('API generate-model-number fallback to local generator', err);
    }
    const local = generateAutomatedModelNumber(catId);
    setModelNumber(local);
  };

  // Check if current model number already exists in DB
  const isModelNumberTaken = useMemo(() => {
    if (!modelNumber.trim()) return false;
    return existingModels.some(
      (m) => (m.modelNumber || '').toUpperCase() === modelNumber.trim().toUpperCase()
    );
  }, [modelNumber, existingModels]);

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    // If currently on Review tab, immediately regenerate for new category
    if (activeTab === 'REVIEW') {
      fetchGeneratedModelNumber(newCatId);
    }
  };

  // Cascade RM Selection: Live RM Name search effect
  useEffect(() => {
    if (!cascadeRmQuery || cascadeRmQuery.trim().length < 2) {
      setCascadeRmSuggestions([]);
      setShowCascadeRmDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingRm(true);
      try {
        const catParam = cascadeRmCategory !== 'ALL' ? `&category=${encodeURIComponent(cascadeRmCategory)}` : '';
        const res = await fetch(`/api/price-master?action=search-rm&q=${encodeURIComponent(cascadeRmQuery.trim())}${catParam}`);
        if (res.ok) {
          const data = await res.json();
          setCascadeRmSuggestions(data.results || []);
          setShowCascadeRmDropdown(true);
        }
      } catch (err) {
        console.error('Error searching RM:', err);
      } finally {
        setIsSearchingRm(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [cascadeRmQuery, cascadeRmCategory]);

  const handleSelectRmName = async (rmDesc: string) => {
    setSelectedRmName(rmDesc);
    setCascadeRmQuery(rmDesc);
    setShowCascadeRmDropdown(false);
    setSelectedBrand('');
    setAvailableBrands([]);
    setSelectedVariantId('');
    setAvailableVariants([]);
    setSelectedComponent(null);
    setInputFinalPrice(0);
    setInputListPrice(0);

    setLoadingBrands(true);
    try {
      const res = await fetch(`/api/price-master?action=get-makes&rm=${encodeURIComponent(rmDesc)}`);
      if (res.ok) {
        const data = await res.json();
        const makes = data.makes || [];
        setAvailableBrands(makes);
        if (makes.length === 1) {
          handleSelectBrand(makes[0], rmDesc);
        }
      }
    } catch (err) {
      console.error('Error fetching makes:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleSelectBrand = async (brand: string, rmName = selectedRmName) => {
    setSelectedBrand(brand);
    setSelectedVariantId('');
    setAvailableVariants([]);
    setSelectedComponent(null);
    setInputFinalPrice(0);
    setInputListPrice(0);

    if (!brand) return;

    setLoadingVariants(true);
    try {
      const res = await fetch(`/api/price-master?action=get-variants&rm=${encodeURIComponent(rmName)}&make=${encodeURIComponent(brand)}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setAvailableVariants(items);
        if (items.length === 1) {
          handleSelectVariant(items[0].id, items);
        }
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleSelectVariant = (variantId: string, list = availableVariants) => {
    setSelectedVariantId(variantId);
    const comp = list.find((it: any) => it.id === variantId);
    if (comp) {
      setSelectedComponent(comp);
      const listP = Number(comp.listPrice) > 0 ? Number(comp.listPrice) : (Number(comp.unitPrice) || 0);
      const finalP = Number(comp.finalPrice) > 0 ? Number(comp.finalPrice) : Math.round(listP * 0.90 * 100) / 100;
      setInputListPrice(listP);
      setInputFinalPrice(finalP);
      setInputUnit(comp.unit || 'Nos');
    }
  };

  const handleAddCascadeRmToBom = () => {
    const rmLabel = selectedComponent?.description || selectedRmName || cascadeRmQuery.trim();
    if (!rmLabel) {
      showNotify('error', 'Please enter or select a Raw Material (RM) Name.');
      return;
    }

    const qty = Math.max(1, parseInt(String(inputQuantity).replace(/[^0-9]/g, ''), 10) || 1);
    const finalPrice = Number(inputFinalPrice) || 0;
    const tot = Math.round(qty * finalPrice);
    const gst = Math.round(tot * 0.18);

    const newItem: BomItem = {
      id: `bom-${Date.now()}-${bomItems.length + 1}`,
      sectionName: 'Main Panel',
      sNo: bomItems.length + 1,
      description: rmLabel,
      rating: selectedComponent?.rating || '',
      typeCode: selectedComponent?.typeCode || '',
      make: selectedComponent?.make || selectedBrand || 'Standard',
      unit: inputUnit || selectedComponent?.unit || 'Nos',
      quantity: qty,
      listPrice: inputListPrice || finalPrice,
      unitPrice: finalPrice,
      totalAmount: tot,
      gstAmount: gst,
      grandTotal: tot + gst,
      isMapped: !!selectedComponent,
      category: selectedComponent?.category || 'Switchgear & Protection',
    };

    setBomItems((prev) => [...prev, newItem]);
    showNotify('success', `Added "${newItem.description} (${newItem.make})" to BOM!`);

    // Reset selection for next item
    setCascadeRmQuery('');
    setSelectedRmName('');
    setAvailableBrands([]);
    setSelectedBrand('');
    setAvailableVariants([]);
    setSelectedVariantId('');
    setSelectedComponent(null);
    setInputQuantity(1);
    setInputFinalPrice(0);
    setInputListPrice(0);
  };

  // Fetch Categories & Existing models for cloning
  useEffect(() => {
    async function loadInitData() {
      try {
        const [catRes, fgRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/finished-goods'),
        ]);

        let loadedCategories: any[] = [];
        let loadedExisting: any[] = [];

        if (catRes.ok) {
          const catData = await catRes.json();
          loadedCategories = catData.categories || [];
          setCategories(loadedCategories);
          if (loadedCategories.length > 0) {
            setCategoryId((prev) => prev || loadedCategories[0].id);
          }
        }

        if (fgRes.ok) {
          const fgData = await fgRes.json();
          loadedExisting = fgData.finishedGoods || [];
          setExistingModels(loadedExisting);
        }
      } catch (err) {
        console.error('Failed to load init data', err);
      }
    }
    loadInitData();
  }, []);

  // When moving to REVIEW tab, ensure model number is generated
  const goToReviewTab = () => {
    if (unpricedItems.length > 0) {
      showNotify('error', `Cannot proceed: ${unpricedItems.length} items have missing prices.`);
      return;
    }
    if (!modelNumber.trim() || isModelNumberTaken) {
      fetchGeneratedModelNumber(categoryId);
    }
    goToTab('REVIEW');
  };

  // 1-Click Clone from Existing Model
  const handleLoadFromTemplate = async (sourceId: string) => {
    if (!sourceId) return;
    try {
      showNotify('success', 'Loading model template...');
      const res = await fetch(`/api/finished-goods/${sourceId}`);
      if (!res.ok) throw new Error('Failed to load template model');
      const data = await res.json();
      const fg = data.finishedGood;

      // Smart revision number that avoids conflicts
      let revNum = 1;
      let candidateRev = `${fg.modelNumber}-REV${revNum}`;
      const existingSet = new Set(existingModels.map((m) => (m.modelNumber || '').toUpperCase()));
      while (existingSet.has(candidateRev.toUpperCase())) {
        revNum++;
        candidateRev = `${fg.modelNumber}-REV${revNum}`;
      }

      setModelNumber(candidateRev);
      setName(`${fg.name} (Custom)`);
      setCategoryId(fg.categoryId);
      setDescription(fg.description || '');
      if (fg.enclosureHeight) setEnclosureHeight(String(fg.enclosureHeight));
      if (fg.enclosureWidth) setEnclosureWidth(String(fg.enclosureWidth));
      if (fg.enclosureDepth) setEnclosureDepth(String(fg.enclosureDepth));
      if (fg.ipRating) setIpRating(fg.ipRating);
      if (fg.formRating) setFormRating(fg.formRating);

      // Populate stages
      setFabManualOverride(String(fg.fabricationCost || 75000));
      setBusbarManualOverride(String(fg.busbarCost || 51000));
      setWireManualOverride(String(fg.wiringCost || 25000));
      setProfitMarginPercent(String(fg.profitMarginPercent || 15));

      // Populate BOM items
      if (fg.bomItems && fg.bomItems.length > 0) {
        const loadedItems: BomItem[] = fg.bomItems.map((it: any, idx: number) => ({
          id: `bom-${Date.now()}-${idx + 1}`,
          sectionName: it.sectionName || 'Main DC Control Panel',
          sNo: it.sNo || idx + 1,
          description: it.description,
          rating: it.rating || '',
          typeCode: it.typeCode || '',
          make: it.make || 'Standard',
          unit: it.unit || 'Nos',
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalAmount: it.totalAmount,
          gstAmount: it.gstAmount,
          grandTotal: it.grandTotal,
          isMapped: true,
        }));
        setBomItems(loadedItems);
      }

      // Populate variants
      if (fg.variants && fg.variants.length > 0) {
        setVariants(
          fg.variants.map((v: any) => ({
            dimensionName: v.dimensionName,
            options: (v.options || []).map((o: any) => ({
              optionName: o.optionName,
              isDefault: o.isDefault,
              priceDelta: o.priceDelta,
              description: o.description || '',
            })),
          }))
        );
      }

      showNotify('success', `Loaded ${fg.bomItems?.length || 0} materials & costing from ${fg.modelNumber}!`);
    } catch (err: any) {
      showNotify('error', err.message);
    }
  };

  // Sections in current BOM
  const sections = useMemo(() => {
    const set = new Set<string>();
    bomItems.forEach((b) => set.add(b.sectionName));
    if (set.size === 0) set.add('Main DC Control Panel');
    return Array.from(set);
  }, [bomItems]);

  // Unpriced items count
  const unpricedItems = useMemo(() => {
    return bomItems.filter((it) => it.unitPrice === null || it.unitPrice <= 0);
  }, [bomItems]);

  // BOM Material Sum
  const bomMaterialSum = useMemo(() => {
    return bomItems.reduce((acc, it) => acc + (it.totalAmount || 0), 0);
  }, [bomItems]);

  // Current panel category helpers
  const currentCategoryCode = useMemo(() => {
    const selectedCat = categories.find((c) => c.id === categoryId);
    return (selectedCat?.code || '').toUpperCase();
  }, [categories, categoryId]);

  const currentCategoryName = useMemo(() => {
    const selectedCat = categories.find((c) => c.id === categoryId);
    return selectedCat?.name || 'Selected Category';
  }, [categories, categoryId]);

  const currentRelevantSections = useMemo(() => {
    return CATEGORY_SECTION_MAP[currentCategoryCode] || [];
  }, [currentCategoryCode]);

  // Fetch suggestions from Central Price Master for in-row search
  const fetchPriceMasterSuggestions = async (query: string) => {
    try {
      const url = `/api/price-master?search=${encodeURIComponent(query)}&limit=30`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
      return [];
    } catch {
      return [];
    }
  };

  // In-row typeahead search effect
  useEffect(() => {
    if (!activeRowDropdownId) return;
    const timer = setTimeout(async () => {
      setIsRowSearching(true);
      const results = await fetchPriceMasterSuggestions(rowSearchQuery);
      setRowSuggestions(results);
      setIsRowSearching(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [rowSearchQuery, activeRowDropdownId]);

  // Select item for a specific row
  const handleSelectRowComponent = (targetId: string, comp: any) => {
    const unitPrice = comp.unitPrice || 0;
    setBomItems((prev) =>
      prev.map((it) => {
        if (it.id === targetId) {
          const tot = Math.round(it.quantity * unitPrice);
          const gst = Math.round(tot * 0.18);
          return {
            ...it,
            description: comp.description,
            rating: comp.rating || '',
            typeCode: comp.typeCode || '',
            make: comp.make || 'Standard',
            unit: comp.unit || 'Nos',
            unitPrice,
            totalAmount: tot,
            gstAmount: gst,
            grandTotal: tot + gst,
            isMapped: true,
            category: comp.category,
          };
        }
        return it;
      })
    );
    setActiveRowDropdownId(null);
    showNotify('success', `Populated "${comp.description}" (₹${unitPrice.toLocaleString('en-IN')}) from Price Master`);
  };

  // Stage 1 Auto-calculation (with editable parameters)
  const calculatedFabCost = useMemo(() => {
    const H = parseFloat(enclosureHeight) || 2000;
    const W = parseFloat(enclosureWidth) || 1000;
    const D = parseFloat(enclosureDepth) || 600;
    const complexity = parseFloat(fabComplexityFactor) || 1.6;
    const coatingRate = parseFloat(fabPowderCoatingRate) || 450;

    // Area in m2: 2 * (HW + HD + WD) / 10^6 * complexity
    const areaM2 = 2 * ((H * W) + (H * D) + (W * D)) / 1000000 * complexity;
    const sheetAndCoating = areaM2 * coatingRate * fabSheetMultiplier;
    return Math.round(sheetAndCoating + fabPlinthGlandCost + fabLocksGasketCost);
  }, [enclosureHeight, enclosureWidth, enclosureDepth, fabComplexityFactor, fabPowderCoatingRate, fabSheetMultiplier, fabPlinthGlandCost, fabLocksGasketCost]);

  // Stage 2 Auto-calculation (with editable parameters)
  const calculatedBusbarCost = useMemo(() => {
    const amps = parseFloat(busbarAmps) || 680;
    const cd = parseFloat(busbarCurrentDensity) || (busbarMaterial === 'COPPER' ? 1.2 : 0.8);
    const ratePerKg = parseFloat(busbarCommodityRate) || (busbarMaterial === 'COPPER' ? 950 : 380);

    const requiredAreaMm2 = amps / cd;
    const density = busbarMaterial === 'COPPER' ? 8.9 : 2.7; // kg/dm3
    const estWeightKg = (requiredAreaMm2 * busbarRunLength * density) / 1000;
    const rawMetalCost = estWeightKg * ratePerKg;
    return Math.round(rawMetalCost + busbarSleevesCost + busbarLaborCost);
  }, [busbarAmps, busbarCurrentDensity, busbarMaterial, busbarCommodityRate, busbarRunLength, busbarSleevesCost, busbarLaborCost]);

  // Stage 3 Auto-calculation (with editable parameters)
  const calculatedWiringCost = useMemo(() => {
    const points = parseFloat(wirePointsCount) || 180;
    const laborPerPoint = parseFloat(wireLaborRatePerPoint) || 35;
    const labor = points * laborPerPoint * wireComplexityFactor;
    const mat = parseFloat(wireMaterialsCost) || 18700;
    return Math.round(labor + mat);
  }, [wirePointsCount, wireLaborRatePerPoint, wireComplexityFactor, wireMaterialsCost]);

  // Final 4-Stage Breakdown
  const stage1Cost = parseFloat(fabManualOverride) || calculatedFabCost;
  const stage2Cost = parseFloat(busbarManualOverride) || calculatedBusbarCost;
  const stage3Cost = parseFloat(wireManualOverride) || calculatedWiringCost;

  // Direct Manufacturing Cost: BOM Materials + Stage 1 + Stage 2 + Stage 3
  const directManufacturingCost = useMemo(() => {
    return Math.round(bomMaterialSum + stage1Cost + stage2Cost + stage3Cost);
  }, [bomMaterialSum, stage1Cost, stage2Cost, stage3Cost]);

  // Stage 4 Commercial Calculations (with editable parameters)
  const fatTestingCost = Math.round(directManufacturingCost * (parseFloat(fatTestingPercent) / 100));
  const designEngineeringCost = Math.round(directManufacturingCost * (parseFloat(designEngPercent) / 100));
  const overheadCost = Math.round(directManufacturingCost * (parseFloat(overheadPercent) / 100));
  const subtotalBeforeMargin = directManufacturingCost + fatTestingCost + designEngineeringCost + overheadCost;

  const profitMarginPct = parseFloat(profitMarginPercent) || 15;
  const finalExWorksPrice = Math.round(subtotalBeforeMargin * (1 + profitMarginPct / 100));
  const gstAmount = Math.round(finalExWorksPrice * (gstRatePercent / 100));
  const finalGrossPrice = finalExWorksPrice + gstAmount;

  // Handle Excel BOM Upload (No Price Required)
  const handleBomFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBom(true);
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/finished-goods/bom-upload', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse BOM Excel');
      }

      const data = await res.json();
      setBomItems(data.items || []);

      if (data.unmappedCount > 0) {
        showNotify(
          'error',
          `Parsed ${data.totalCount} items! ${data.mappedCount} matched in Price Master. ⚠️ ${data.unmappedCount} new unmapped items require price entry before continuing.`
        );
      } else {
        showNotify('success', `Success! All ${data.totalCount} items matched with Price Master.`);
      }
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setUploadingBom(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Price Entry for a BOM Item
  const handlePriceChange = (item: BomItem, val: string) => {
    const num = parseFloat(val);
    const validNum = isNaN(num) ? 0 : num;

    // Update item immediately in state
    setBomItems((prev) =>
      prev.map((it) => {
        if (it.id === item.id) {
          const total = Math.round(it.quantity * validNum);
          const gst = Math.round(total * 0.18);
          return {
            ...it,
            unitPrice: validNum,
            totalAmount: total,
            gstAmount: gst,
            grandTotal: total + gst,
          };
        }
        return it;
      })
    );

    // If item was unmapped and user typed a real price (> 0), trigger prompt:
    if (!item.isMapped && validNum > 0) {
      setUnmappedPrompt({
        show: true,
        item: { ...item, unitPrice: validNum },
        enteredPrice: validNum,
      });
      setAddMasterCategory(item.category || 'Switchgear & Protection');
    }
  };

  // Response: YES, Add to Price Master
  const handleConfirmAddToMaster = async () => {
    if (!unmappedPrompt.item) return;
    const { item, enteredPrice } = unmappedPrompt;

    try {
      const res = await fetch('/api/price-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: item.make,
          category: addMasterCategory,
          description: item.description,
          rating: item.rating,
          typeCode: item.typeCode,
          unit: item.unit,
          unitPrice: enteredPrice,
          hsnCode: addMasterHsn || '8537',
          gstRate: 18,
        }),
      });

      if (!res.ok) throw new Error('Failed to save component to Price Master');
      const data = await res.json();

      // Mark item as mapped
      setBomItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isMapped: true, category: addMasterCategory } : it))
      );

      showNotify('success', `Saved "${item.description}" to Central Price Master!`);
      setUnmappedPrompt({ show: false, item: null, enteredPrice: 0 });
    } catch (err: any) {
      showNotify('error', err.message);
    }
  };

  // Response: NO, Save for this Product Only
  const handleDismissAddToMaster = () => {
    if (unmappedPrompt.item) {
      // Just keep price for this BOM row without marking as master-mapped
      showNotify('success', `Price ₹${unmappedPrompt.enteredPrice.toLocaleString('en-IN')} kept for this product alone.`);
    }
    setUnmappedPrompt({ show: false, item: null, enteredPrice: 0 });
  };

  // Add Manual Section
  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    setActiveSection(newSectionName.trim());
    setNewSectionName('');
  };

  // Add Manual Item to Active Section
  const handleAddManualItem = () => {
    const newItem: BomItem = {
      id: `bom-${Date.now()}-${bomItems.length + 1}`,
      sectionName: activeSection,
      sNo: bomItems.length + 1,
      description: 'New Electrical Component',
      rating: '',
      typeCode: '',
      make: 'Standard',
      unit: 'Nos',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      gstAmount: 0,
      grandTotal: 0,
      isMapped: false,
    };
    setBomItems([...bomItems, newItem]);
  };

  // Delete BOM Item
  const handleDeleteBomItem = (id: string) => {
    setBomItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Jump to First Unpriced Row
  const handleJumpToUnpriced = () => {
    const firstUnpriced = unpricedItems[0];
    if (firstUnpriced) {
      setActiveSection(firstUnpriced.sectionName);
      const el = document.getElementById(`price-input-${firstUnpriced.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  };

  // Save Finished Good
  const handleSaveFinishedGood = async () => {
    let finalModel = modelNumber.trim().toUpperCase();
    if (!finalModel || isModelNumberTaken) {
      finalModel = generateAutomatedModelNumber(categoryId);
      setModelNumber(finalModel);
    }
    if (!name.trim()) {
      showNotify('error', 'Product Name is required.');
      goToTab('SPECS');
      return;
    }
    if (!categoryId) {
      showNotify('error', 'Product Category is required.');
      goToTab('SPECS');
      return;
    }
    if (bomItems.length === 0) {
      showNotify('error', 'Please add BOM materials or upload an Excel BOM file.');
      goToTab('BOM');
      return;
    }
    if (unpricedItems.length > 0) {
      showNotify('error', `Cannot save: ${unpricedItems.length} items have missing prices. Price is mandatory.`);
      goToTab('BOM');
      return;
    }

    try {
      setSavingFg(true);
      const payload = {
        modelNumber: finalModel,
        name: name.trim(),
        categoryId,
        description: description.trim(),
        enclosureHeight: parseFloat(enclosureHeight),
        enclosureWidth: parseFloat(enclosureWidth),
        enclosureDepth: parseFloat(enclosureDepth),
        ipRating,
        formRating,
        bomMaterialCost: bomMaterialSum,
        fabricationCost: stage1Cost,
        busbarCost: stage2Cost,
        wiringCost: stage3Cost,
        netManufacturingCost: directManufacturingCost,
        fatTestingCost,
        designEngineeringCost,
        overheadCost,
        profitMarginPercent: profitMarginPct,
        finalExWorksPrice,
        gstAmount,
        finalGrossPrice,
        bomItems,
        variants,
      };

      const res = await fetch('/api/finished-goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save Product');
      }

      const data = await res.json();
      showNotify('success', `Product "${data.finishedGood.modelNumber}" created successfully!`);
      setTimeout(() => {
        router.push('/admin/finished-goods');
      }, 1000);
    } catch (err: any) {
      showNotify('error', err.message);
    } finally {
      setSavingFg(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900 text-rose-400 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            <span>4-Stage Industrial Panel Costing Workstation</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Create Product (Product Costing & Estimation)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Select BOM materials from Inbuilt Price Master, execute 4-stage engineering costing, define variant upgrades, and save official Model Number.
          </p>
        </div>

        {/* 1-Click Clone Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <Copy className="w-4 h-4 text-blue-400" />
          <div className="text-left">
            <span className="block text-[10px] text-slate-400 font-semibold uppercase">1-Click Clone Template:</span>
            <select
              onChange={(e) => handleLoadFromTemplate(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled className="bg-slate-900 text-slate-400">
                Select Model to Clone...
              </option>
              {existingModels.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.modelNumber} ({m._count?.bomItems || 0} BOM items)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step Tabs Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-2">
        <button
          onClick={() => goToTab('SPECS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'SPECS'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
          <span>Panel Profile & Dimensions</span>
        </button>

        <button
          onClick={() => goToTab('BOM')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'BOM'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
          <span>BOM Materials ({bomItems.length})</span>
          {unpricedItems.length > 0 && (
            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {unpricedItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            if (unpricedItems.length > 0) {
              showNotify('error', `Cannot proceed: ${unpricedItems.length} items have missing prices.`);
              return;
            }
            goToTab('STAGES');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'STAGES'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
          <span>The 4 Costing Stages</span>
        </button>

        <button
          onClick={goToReviewTab}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'REVIEW'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">4</span>
          <span>Commercial Review & Save</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PANEL PROFILE & ENCLOSURE DIMENSIONS                               */}
      {/* ========================================================================= */}
      {activeTab === 'SPECS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 1: Product Classification & Physical Enclosure</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the panel category, official model number, and sheet metal dimensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Category *</label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Industrial Motor Control Center Panel"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Model Number <span className="text-blue-600 font-mono text-[10px]">(Step 4 Auto-Gen)</span>
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                <span>{modelNumber || `SVG-${(categories.find(c => c.id === categoryId)?.code || 'PNL').replace('CAT-', '')}-${new Date().getFullYear()}-001`}</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">Step 4 Finalized</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                ✓ Official sequence will generate automatically at Step 4 (Commercial Review & Save).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Engineering Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Complete DC drive control system with ABB DCS880 680A drive, Mitsubishi FX5U PLC, 10 inch HMI, and EC Aluminum busbar power distribution."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Enclosure Dimensions Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>Enclosure Physical Dimensions & Ratings</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Height (H) mm</label>
                <input
                  type="number"
                  value={enclosureHeight}
                  onChange={(e) => setEnclosureHeight(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Width (W) mm</label>
                <input
                  type="number"
                  value={enclosureWidth}
                  onChange={(e) => setEnclosureWidth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Depth (D) mm</label>
                <input
                  type="number"
                  value={enclosureDepth}
                  onChange={(e) => setEnclosureDepth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ingress Protection (IP)</label>
                <select
                  value={ipRating}
                  onChange={(e) => setIpRating(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="IP42">IP42 (Indoor Normal)</option>
                  <option value="IP52">IP52 (Drip-proof)</option>
                  <option value="IP54">IP54 (Dust & Splash Proof)</option>
                  <option value="IP55">IP55 (Water Jet Protected)</option>
                  <option value="IP65">IP65 (Weatherproof Outdoor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Form of Separation</label>
                <select
                  value={formRating}
                  onChange={(e) => setFormRating(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Form 2B">Form 2B (Standard)</option>
                  <option value="Form 3B">Form 3B (Segregated)</option>
                  <option value="Form 4B">Form 4B (Full Compartment)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => goToTab('BOM')}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all"
            >
              <span>Next: BOM Materials</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BOM MATERIALS (EXCEL UPLOAD WITHOUT PRICE & UNMAPPED ALERT)        */}
      {/* ========================================================================= */}
      {activeTab === 'BOM' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Step 2: Bill of Materials (BOM)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your Excel BOM (prices are not required in template) or add materials manually.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/finished-goods/bom-template"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>BOM Excel Template</span>
              </a>

              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingBom ? 'Reading Excel...' : 'Upload BOM Excel'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleBomFileUpload}
                  className="hidden"
                  disabled={uploadingBom}
                />
              </label>

              <button
                onClick={handleAddManualItem}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* CRUCIAL UNPRICED ITEMS ALERT BANNER (If Any Unmapped Items) */}
          {unpricedItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {unpricedItems.length} Unmapped / New Components Require Price
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    These items were not found in the Central Price Master. Entering a unit price is mandatory before proceeding to the 4 costing stages.
                  </p>
                </div>
              </div>

              <button
                onClick={handleJumpToUnpriced}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-sm active:scale-95 whitespace-nowrap"
              >
                Jump to First Unpriced Item &rarr;
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* CASCADE RAW MATERIAL (RM) SELECTOR FROM PRICE MASTER       */}
          {/* Flow: Assembly Section -> RM Name -> Brand -> Variant      */}
          {/* Displays: Name, Brand, Variant, List Price(MRP), Final Price */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 p-5 rounded-2xl border-2 border-blue-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-mono tracking-wide flex items-center gap-2">
                    <span>Cascade Raw Material (RM) Selector</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-sans font-bold">
                      Price Master Integrated
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Step 1: Type RM Name &bull; Step 2: Select Brand &bull; Step 3: Select Variant (Spec / Rating) &bull; Step 4: Enter Quantity (Integer) &bull; Check Price &bull; Add to BOM
                  </p>
                </div>
              </div>

              {/* Panel Category Filter Badge */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Panel: <strong className="text-blue-700">{currentCategoryName}</strong>
                </span>
              </div>
            </div>

            {/* Cascade Controls Grid: RM Name -> Brand -> Variant -> Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Field 1: RM Name (Live Typeahead Dropdown) */}
              <div className="relative md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. RM Name (Type & Select) *
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={cascadeRmQuery}
                    onChange={(e) => {
                      setCascadeRmQuery(e.target.value);
                      setShowCascadeRmDropdown(true);
                      if (!e.target.value.trim()) {
                        setSelectedRmName('');
                        setAvailableBrands([]);
                        setSelectedBrand('');
                        setAvailableVariants([]);
                        setSelectedVariantId('');
                        setSelectedComponent(null);
                      }
                    }}
                    onFocus={() => {
                      if (cascadeRmSuggestions.length > 0) setShowCascadeRmDropdown(true);
                    }}
                    placeholder="e.g. MCCB, VFD, Contactor, Relay..."
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  {cascadeRmQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCascadeRmQuery('');
                        setSelectedRmName('');
                        setAvailableBrands([]);
                        setSelectedBrand('');
                        setAvailableVariants([]);
                        setSelectedVariantId('');
                        setSelectedComponent(null);
                        setShowCascadeRmDropdown(false);
                      }}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions */}
                {showCascadeRmDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 min-w-full">
                    <div className="p-2 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{isSearchingRm ? 'Searching Price Master...' : `${cascadeRmSuggestions.length} matching RM items`}</span>
                      <button
                        type="button"
                        onClick={() => setShowCascadeRmDropdown(false)}
                        className="text-xs font-bold hover:text-slate-800"
                      >
                        ✕
                      </button>
                    </div>

                    {cascadeRmSuggestions.length === 0 && !isSearchingRm ? (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        No materials found. Type a different description.
                      </div>
                    ) : (
                      cascadeRmSuggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectRmName(sug.description)}
                          className="p-3 hover:bg-blue-50/80 cursor-pointer text-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 last:border-b-0"
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-slate-900 whitespace-normal break-words leading-tight">
                              {sug.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-mono">
                              {sug.typeCode && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{sug.typeCode}</span>}
                              {sug.rating && <span>Rating: {sug.rating}</span>}
                            </div>
                          </div>
                          {sug.category && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">
                              {sug.category}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: Brand (Make Dropdown) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Brand (Make) *
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => handleSelectBrand(e.target.value)}
                  disabled={!selectedRmName && availableBrands.length === 0}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {loadingBrands
                      ? 'Loading Brands...'
                      : availableBrands.length > 0
                      ? 'Select Brand / Make...'
                      : 'Select RM Name First'}
                  </option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: Variant (Rating / Spec / Catalog No) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Variant (Spec / Rating) *
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => handleSelectVariant(e.target.value)}
                  disabled={!selectedBrand || availableVariants.length === 0}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {loadingVariants
                      ? 'Loading Variants...'
                      : availableVariants.length > 0
                      ? 'Select Variant / Rating...'
                      : 'Select Brand First'}
                  </option>
                  {availableVariants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.rating || v.typeCode || 'Standard'} {v.typeCode ? `(${v.typeCode})` : ''} — MRP: ₹{(v.unitPrice || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 4: Quantity (Integer only, no decimals) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    4. Quantity *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">No decimals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={inputQuantity}
                    onKeyDown={(e) => {
                      if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      const val = parseInt(clean, 10);
                      setInputQuantity(isNaN(val) || val < 1 ? 1 : val);
                    }}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-center"
                  />
                  <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-2 rounded-xl border border-slate-200 shrink-0">
                    {inputUnit || 'Nos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected RM Summary Bar: Name, Brand, Variant, MRP, Final Price, Total -> Add to BOM */}
            {(selectedRmName || cascadeRmQuery.trim()) && (
              <div className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center text-xs flex-1">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <span className="block text-[10px] text-slate-500 font-mono uppercase">RM Name</span>
                    <strong className="text-slate-900 block truncate" title={selectedComponent?.description || selectedRmName || cascadeRmQuery}>
                      {selectedComponent?.description || selectedRmName || cascadeRmQuery}
                    </strong>
                  </div>

                  {/* Brand */}
                  <div>
                    <span className="block text-[10px] text-slate-500 font-mono uppercase">Brand</span>
                    <strong className="text-blue-800">
                      {selectedComponent?.make || selectedBrand || 'Standard'}
                    </strong>
                  </div>

                  {/* Variant */}
                  <div>
                    <span className="block text-[10px] text-slate-500 font-mono uppercase">Variant / Spec</span>
                    <strong className="text-slate-800 font-mono truncate block">
                      {selectedComponent?.rating || selectedComponent?.typeCode || 'Standard Spec'}
                    </strong>
                  </div>

                  {/* List Price (MRP) */}
                  <div>
                    <span className="block text-[10px] text-slate-500 font-mono uppercase">List Price (MRP)</span>
                    <span className="font-mono font-bold text-slate-700">
                      ₹{inputListPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Final Price, Line Total & Add Button */}
                <div className="flex flex-wrap items-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div>
                    <span className="block text-[10px] text-emerald-700 font-bold font-mono uppercase">
                      Final Price (₹) *
                    </span>
                    <input
                      type="number"
                      value={inputFinalPrice}
                      onChange={(e) => setInputFinalPrice(parseFloat(e.target.value) || 0)}
                      className="w-28 px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="block text-[10px] text-slate-500 uppercase">Total ({inputQuantity} {inputUnit})</span>
                    <strong className="text-emerald-700 text-sm">
                      ₹{Math.round(inputQuantity * inputFinalPrice).toLocaleString('en-IN')}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCascadeRmToBom}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add RM to BOM</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BOM Items Table */}
          {bomItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No BOM Items Added Yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Select raw materials from the 4-step selector above or upload your panel BOM Excel file.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 uppercase font-mono text-[10px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">S.No</th>
                      <th className="py-3 px-3">RM Name (Material)</th>
                      <th className="py-3 px-3 w-24">Brand</th>
                      <th className="py-3 px-3">Variant / Spec</th>
                      <th className="py-3 px-2 text-center w-28">Qty & Unit</th>
                      <th className="py-3 px-3 text-right w-28">List Price (MRP)</th>
                      <th className="py-3 px-3 text-right w-28">Final Price (₹)</th>
                      <th className="py-3 px-3 text-right w-28">Total Amount (₹)</th>
                      <th className="py-3 px-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {bomItems.map((item, idx) => {
                      const isUnpriced = item.unitPrice === null || item.unitPrice <= 0;
                      const listRate = item.listPrice !== undefined && item.listPrice > 0 ? item.listPrice : (item.unitPrice || 0);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isUnpriced
                              ? 'bg-amber-50/80 hover:bg-amber-100/80 border-l-4 border-l-amber-500'
                              : idx % 2 === 0
                              ? 'bg-white hover:bg-blue-50/30'
                              : 'bg-slate-50/30 hover:bg-blue-50/30'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                            {item.sNo || idx + 1}
                          </td>

                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs relative">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.description}
                                  onFocus={() => {
                                    setActiveRowDropdownId(item.id);
                                    setRowSearchQuery(item.description);
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBomItems((prev) =>
                                      prev.map((it) => (it.id === item.id ? { ...it, description: val } : it))
                                    );
                                    setActiveRowDropdownId(item.id);
                                    setRowSearchQuery(val);
                                  }}
                                  placeholder="Type component name..."
                                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 font-medium text-xs"
                                />

                                {/* In-row Typeahead Autocomplete Popover */}
                                {activeRowDropdownId === item.id && (
                                  <div className="absolute top-full left-0 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 mt-1 max-h-60 overflow-y-auto divide-y divide-slate-100 text-left">
                                    <div className="p-2 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                      <span>
                                        {isRowSearching
                                          ? 'Searching...'
                                          : `Price Master (${rowSuggestions.length} found)`}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveRowDropdownId(null);
                                        }}
                                        className="font-bold hover:text-slate-800"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    {rowSuggestions.length === 0 && !isRowSearching ? (
                                      <div className="p-3 text-[11px] text-slate-400">
                                        No exact match in Price Master. Custom item will be used.
                                      </div>
                                    ) : (
                                      rowSuggestions.map((sug) => (
                                        <div
                                          key={sug.id || sug.itemCode}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelectRowComponent(item.id, sug);
                                          }}
                                          className="p-2 hover:bg-blue-50/80 cursor-pointer text-xs transition-colors"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <span className="font-bold text-slate-900 whitespace-normal break-words leading-tight flex-1">
                                              {sug.description}
                                            </span>
                                            <span className="font-mono font-bold text-emerald-600 text-[11px] shrink-0">
                                              ₹{(sug.unitPrice || 0).toLocaleString('en-IN')}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-mono">
                                            <span className="font-bold text-slate-700">{sug.make}</span>
                                            <span>•</span>
                                            <span>{sug.category}</span>
                                            {sug.rating && <span>• {sug.rating}</span>}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-3 font-semibold text-[11px]">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  (item.make || '').toUpperCase() === 'ABB'
                                    ? 'bg-rose-100 text-rose-800'
                                    : (item.make || '').toUpperCase() === 'SIEMENS'
                                    ? 'bg-teal-100 text-teal-800'
                                    : (item.make || '').toUpperCase() === 'SCHNEIDER'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : (item.make || '').toUpperCase() === 'MITSUBISHI'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {item.make || 'Standard'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              {item.rating || item.typeCode ? (
                                <span>
                                  {item.rating} {item.typeCode ? `(${item.typeCode})` : ''}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>

                            <td className="py-2.5 px-2 text-center font-mono font-bold">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onKeyDown={(e) => {
                                    if (['.', ',', '-', 'e', 'E'].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    const q = Math.max(1, parseInt(raw, 10) || 1);
                                    setBomItems((prev) =>
                                      prev.map((it) => {
                                        if (it.id === item.id) {
                                          const tot = Math.round(q * (it.unitPrice || 0));
                                          const gst = Math.round(tot * 0.18);
                                          return { ...it, quantity: q, totalAmount: tot, gstAmount: gst, grandTotal: tot + gst };
                                        }
                                        return it;
                                      })
                                    );
                                  }}
                                  className="w-14 text-center bg-white border border-slate-200 rounded px-1 py-0.5 text-xs font-mono font-bold focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 font-normal">{item.unit || 'Nos'}</span>
                              </div>
                            </td>

                            {/* List Price (MRP) */}
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                              {listRate > 0 ? `₹${listRate.toLocaleString('en-IN')}` : '-'}
                            </td>

                            {/* Final Price / Unit (Editable) */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="relative">
                                <input
                                  id={`price-input-${item.id}`}
                                  type="number"
                                  value={item.unitPrice !== null ? item.unitPrice : ''}
                                  placeholder="Enter ₹"
                                  onChange={(e) => handlePriceChange(item, e.target.value)}
                                  className={`w-24 text-right px-2 py-1 rounded text-xs font-mono font-bold focus:outline-none transition-all ${
                                    isUnpriced
                                      ? 'bg-amber-100 border-2 border-amber-500 text-amber-950 placeholder-amber-600 animate-pulse'
                                      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-500'
                                  }`}
                                />
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{(item.totalAmount || 0).toLocaleString('en-IN')}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => handleDeleteBomItem(item.id)}
                                className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary */}
              <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between font-mono text-xs">
                <span className="font-semibold text-slate-400">
                  Total BOM Line Items: {bomItems.length} materials
                </span>
                <div className="flex items-center gap-6">
                  <span>
                    Direct Bought-Out Materials Sum:{' '}
                    <strong className="text-emerald-400 text-sm">₹{bomMaterialSum.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => goToTab('SPECS')}
              className="flex items-center gap-2 px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: Panel Profile</span>
            </button>

            <button
              onClick={() => {
                if (unpricedItems.length > 0) {
                  showNotify(
                    'error',
                    `Cannot proceed: ${unpricedItems.length} items still have missing prices. Enter price for all items.`
                  );
                  handleJumpToUnpriced();
                  return;
                }
                goToTab('STAGES');
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <span>Next: The 4 Costing Stages</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: THE 4 COSTING STAGES (FAB, BUSBAR, WIRING, COMMERCIAL MARGINS)      */}
      {/* ========================================================================= */}
      {activeTab === 'STAGES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 3: The 4-Stage Panel Costing Engine</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic calculations for Enclosure Fabrication, Busbars, Wiring, and Final Overheads/Margins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* STAGE 1: FABRICATION CHARGES */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Fabrication Charges (Enclosure)
                    </h3>
                    <span className="text-[10px] font-mono text-blue-700 font-bold">
                      Calculated Output: ₹{calculatedFabCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Edit Formula Button */}
                <button
                  type="button"
                  onClick={() => setEditingFabFormula(!editingFabFormula)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingFabFormula ? 'Close Editor' : 'Edit Formula'}</span>
                </button>
              </div>

              {/* VISIBLE FORMULA DISPLAY BANNER */}
              <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3 text-[11px] text-blue-950 font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-800 text-[10px] uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  <span>Active Formula</span>
                </div>
                <p className="text-slate-700">
                  Area (m²) = 2 × (H×W + H×D + W×D) ÷ 10⁶ × Factor (<strong>{fabComplexityFactor}</strong>)
                </p>
                <p className="text-blue-900 font-bold">
                  Fab Cost = [Area × ₹{fabPowderCoatingRate}/m² × Multiplier (<strong>{fabSheetMultiplier}</strong>)] + Plinth (<strong>₹{fabPlinthGlandCost.toLocaleString('en-IN')}</strong>) + Locks & Gasket (<strong>₹{fabLocksGasketCost.toLocaleString('en-IN')}</strong>)
                </p>
              </div>

              {/* FORMULA EDIT DRAWER */}
              {editingFabFormula && (
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-amber-600" />
                      Alter Stage 1 Formula Variables
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFabSheetMultiplier(4.2);
                        setFabPlinthGlandCost(9000);
                        setFabLocksGasketCost(6000);
                        setFabComplexityFactor('1.6');
                        showNotify('success', 'Reset Stage 1 formula to standard defaults.');
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Sheet Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fabSheetMultiplier}
                        onChange={(e) => setFabSheetMultiplier(parseFloat(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Complexity Factor</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fabComplexityFactor}
                        onChange={(e) => setFabComplexityFactor(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Base Plinth & Gland (₹)</label>
                      <input
                        type="number"
                        value={fabPlinthGlandCost}
                        onChange={(e) => setFabPlinthGlandCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Locks & Gasket Base (₹)</label>
                      <input
                        type="number"
                        value={fabLocksGasketCost}
                        onChange={(e) => setFabLocksGasketCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">
                      New Output: ₹{calculatedFabCost.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFabManualOverride(String(calculatedFabCost));
                        showNotify('success', `Applied formula output ₹${calculatedFabCost.toLocaleString('en-IN')} to active charge!`);
                        setEditingFabFormula(false);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Apply to Active Charge
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Sheet Thickness</label>
                  <select
                    value={fabSheetGauge}
                    onChange={(e) => setFabSheetGauge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="14 Gauge (2.0mm)">14 Gauge (2.0mm Frame / Doors)</option>
                    <option value="16 Gauge (1.6mm)">16 Gauge (1.6mm Standard)</option>
                    <option value="Modular CRCA">Modular Suite / Form 4B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Powder Coating Rate (₹/m²)</label>
                  <input
                    type="number"
                    value={fabPowderCoatingRate}
                    onChange={(e) => setFabPowderCoatingRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Active Fabrication Charge (Override ₹ if needed):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fabManualOverride}
                    onChange={(e) => setFabManualOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-blue-500 rounded-lg text-sm font-mono font-black text-slate-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">INR</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Includes 7-tank pre-treatment, powder coating, plinth, and gland plate.</p>
              </div>
            </div>

            {/* STAGE 2: BUSBAR CHARGES */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Busbar System Charges
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-800 font-bold">
                      Calculated Output: ₹{calculatedBusbarCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Edit Formula Button */}
                <button
                  type="button"
                  onClick={() => setEditingBusbarFormula(!editingBusbarFormula)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingBusbarFormula ? 'Close Editor' : 'Edit Formula'}</span>
                </button>
              </div>

              {/* VISIBLE FORMULA DISPLAY BANNER */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 text-[11px] text-emerald-950 font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[10px] uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Formula</span>
                </div>
                <p className="text-slate-700">
                  Required Area = Amps ({busbarAmps}A) ÷ CD (<strong>{busbarCurrentDensity}</strong> A/mm²) | Weight(kg) = Area × Length (<strong>{busbarRunLength}m</strong>) × Density ({busbarMaterial === 'COPPER' ? '8.9' : '2.7'}) ÷ 1000
                </p>
                <p className="text-emerald-900 font-bold">
                  Busbar Cost = [Weight × Rate (<strong>₹{busbarCommodityRate}/kg</strong>)] + Sleeves (<strong>₹{busbarSleevesCost.toLocaleString('en-IN')}</strong>) + Bending Labor (<strong>₹{busbarLaborCost.toLocaleString('en-IN')}</strong>)
                </p>
              </div>

              {/* FORMULA EDIT DRAWER */}
              {editingBusbarFormula && (
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-amber-600" />
                      Alter Stage 2 Formula Variables
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBusbarRunLength(12);
                        setBusbarSleevesCost(18000);
                        setBusbarLaborCost(8000);
                        setBusbarCurrentDensity(busbarMaterial === 'COPPER' ? '1.2' : '0.8');
                        setBusbarCommodityRate(busbarMaterial === 'COPPER' ? '950' : '380');
                        showNotify('success', 'Reset Stage 2 formula to standard defaults.');
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Panel Run Length (m)</label>
                      <input
                        type="number"
                        value={busbarRunLength}
                        onChange={(e) => setBusbarRunLength(parseFloat(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Current Density (A/mm²)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={busbarCurrentDensity}
                        onChange={(e) => setBusbarCurrentDensity(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Metal Rate (₹/kg)</label>
                      <input
                        type="number"
                        value={busbarCommodityRate}
                        onChange={(e) => setBusbarCommodityRate(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Sleeves & Supports (₹)</label>
                      <input
                        type="number"
                        value={busbarSleevesCost}
                        onChange={(e) => setBusbarSleevesCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Bending Labor (₹)</label>
                      <input
                        type="number"
                        value={busbarLaborCost}
                        onChange={(e) => setBusbarLaborCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">
                      New Output: ₹{calculatedBusbarCost.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBusbarManualOverride(String(calculatedBusbarCost));
                        showNotify('success', `Applied formula output ₹${calculatedBusbarCost.toLocaleString('en-IN')} to active charge!`);
                        setEditingBusbarFormula(false);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Apply to Active Charge
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Conductor Material</label>
                  <select
                    value={busbarMaterial}
                    onChange={(e) => {
                      const mat = e.target.value as 'ALUMINUM' | 'COPPER';
                      setBusbarMaterial(mat);
                      setBusbarCurrentDensity(mat === 'COPPER' ? '1.2' : '0.8');
                      setBusbarCommodityRate(mat === 'COPPER' ? '950' : '380');
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="ALUMINUM">Electrolytic EC Aluminum (Base)</option>
                    <option value="COPPER">ETP Copper 99.9% Pure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Full Load Rating (Amps)</label>
                  <input
                    type="number"
                    value={busbarAmps}
                    onChange={(e) => setBusbarAmps(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Active Busbar Charge (Override ₹ if needed):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={busbarManualOverride}
                    onChange={(e) => setBusbarManualOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-emerald-500 rounded-lg text-sm font-mono font-black text-slate-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">INR</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Includes heat-shrink PVC sleeves, DMC supports, and bending labor.</p>
              </div>
            </div>

            {/* STAGE 3: WIRING CHARGES */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Control & Power Wiring Charges
                    </h3>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      Calculated Output: ₹{calculatedWiringCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Edit Formula Button */}
                <button
                  type="button"
                  onClick={() => setEditingWireFormula(!editingWireFormula)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingWireFormula ? 'Close Editor' : 'Edit Formula'}</span>
                </button>
              </div>

              {/* VISIBLE FORMULA DISPLAY BANNER */}
              <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-xl p-3 text-[11px] text-indigo-950 font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-800 text-[10px] uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Active Formula</span>
                </div>
                <p className="text-indigo-900 font-bold">
                  Wiring Cost = [Terminations (<strong>{wirePointsCount}</strong>) × Rate (<strong>₹{wireLaborRatePerPoint}/point</strong>) × Factor (<strong>{wireComplexityFactor}</strong>)] + Materials (<strong>₹{parseFloat(wireMaterialsCost || '0').toLocaleString('en-IN')}</strong>)
                </p>
              </div>

              {/* FORMULA EDIT DRAWER */}
              {editingWireFormula && (
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-amber-600" />
                      Alter Stage 3 Formula Variables
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWireLaborRatePerPoint('35');
                        setWireComplexityFactor(1.0);
                        setWireMaterialsCost('18700');
                        showNotify('success', 'Reset Stage 3 formula to standard defaults.');
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Labor Rate / Point (₹)</label>
                      <input
                        type="number"
                        value={wireLaborRatePerPoint}
                        onChange={(e) => setWireLaborRatePerPoint(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Complexity Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        value={wireComplexityFactor}
                        onChange={(e) => setWireComplexityFactor(parseFloat(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Materials Base (₹)</label>
                      <input
                        type="number"
                        value={wireMaterialsCost}
                        onChange={(e) => setWireMaterialsCost(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">
                      New Output: ₹{calculatedWiringCost.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWireManualOverride(String(calculatedWiringCost));
                        showNotify('success', `Applied formula output ₹${calculatedWiringCost.toLocaleString('en-IN')} to active charge!`);
                        setEditingWireFormula(false);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Apply to Active Charge
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Total Wire Terminations Count</label>
                  <input
                    type="number"
                    value={wirePointsCount}
                    onChange={(e) => setWirePointsCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Labor Rate / Point (₹)</label>
                  <input
                    type="number"
                    value={wireLaborRatePerPoint}
                    onChange={(e) => setWireLaborRatePerPoint(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Active Wiring Charge (Override ₹ if needed):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={wireManualOverride}
                    onChange={(e) => setWireManualOverride(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-indigo-500 rounded-lg text-sm font-mono font-black text-slate-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">INR</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Includes copper flexible wires, ferrules, crimping lugs, and cable trunking.</p>
              </div>
            </div>

            {/* STAGE 4: FINAL COMMERCIAL CHARGES */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                    4
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                      Final Charges, Overheads & Margin
                    </h3>
                    <span className="text-[10px] font-mono text-amber-900 font-bold">
                      Direct Manufacturing Cost: ₹{directManufacturingCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Edit Formula Button */}
                <button
                  type="button"
                  onClick={() => setEditingStage4Formula(!editingStage4Formula)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{editingStage4Formula ? 'Close Editor' : 'Edit Formula'}</span>
                </button>
              </div>

              {/* VISIBLE FORMULA DISPLAY BANNER */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 text-[11px] text-amber-950 font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[10px] uppercase tracking-wider">
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active Formula</span>
                </div>
                <p className="text-slate-700">
                  Subtotal = Direct Cost + Direct Cost × (FAT Testing <strong>{fatTestingPercent}%</strong> + Design <strong>{designEngPercent}%</strong> + Overheads <strong>{overheadPercent}%</strong>)
                </p>
                <p className="text-amber-900 font-bold">
                  Ex-Works = Subtotal × (1 + Margin <strong>{profitMarginPercent}%</strong>) | Final Gross = Ex-Works × (1 + GST <strong>{gstRatePercent}%</strong>)
                </p>
              </div>

              {/* FORMULA EDIT DRAWER */}
              {editingStage4Formula && (
                <div className="bg-amber-100/60 border-2 border-amber-300 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-amber-600" />
                      Alter Commercial Markups & Taxes
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFatTestingPercent('2.0');
                        setDesignEngPercent('2.5');
                        setOverheadPercent('4.0');
                        setProfitMarginPercent('15.0');
                        setGstRatePercent(18.0);
                        showNotify('success', 'Reset Stage 4 formula to standard defaults.');
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">FAT Testing (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={fatTestingPercent}
                        onChange={(e) => setFatTestingPercent(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Design & Docs (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={designEngPercent}
                        onChange={(e) => setDesignEngPercent(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Factory Overheads (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={overheadPercent}
                        onChange={(e) => setOverheadPercent(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Target Margin (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={profitMarginPercent}
                        onChange={(e) => setProfitMarginPercent(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">GST Rate (%)</label>
                      <input
                        type="number"
                        step="1"
                        value={gstRatePercent}
                        onChange={(e) => setGstRatePercent(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">
                      Net Gross: ₹{finalGrossPrice.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingStage4Formula(false)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Routine FAT Testing (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={fatTestingPercent}
                    onChange={(e) => setFatTestingPercent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Design & Documentation (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={designEngPercent}
                    onChange={(e) => setDesignEngPercent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Factory Overheads (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={overheadPercent}
                    onChange={(e) => setOverheadPercent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 mb-1 font-bold">Target Profit Margin (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={profitMarginPercent}
                    onChange={(e) => setProfitMarginPercent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border-2 border-amber-500 rounded-lg text-xs font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 mt-2 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Ex-Works Selling Price:</span>
                  <strong className="text-slate-900">₹{finalExWorksPrice.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({gstRatePercent}%):</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-100 pt-1 text-sm">
                  <span>Final Selling Price:</span>
                  <span>₹{finalGrossPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => goToTab('BOM')}
              className="flex items-center gap-2 px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: BOM</span>
            </button>

            <button
              onClick={goToReviewTab}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <span>Next: Commercial Review & Save</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMMERCIAL REVIEW & SAVE FINISHED GOOD                             */}
      {/* ========================================================================= */}
      {activeTab === 'REVIEW' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Step 4: Commercial Review & Official Model Save</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify all 4 stages and finalize the automated model number before saving into the system as an active Finished Good (FG).
            </p>
          </div>

          {/* ========================================================= */}
          {/* AUTOMATED MODEL NUMBER FINALIZATION WORKSTATION           */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl border border-blue-900/50 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <Zap className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Official Model Number & Nomenclature
                    <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                      Auto-Generated
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Standardized format: <code className="text-blue-300">SVG-[CATEGORY]-[YEAR]-[SEQUENCE]</code> (e.g. SVG-MCC-2026-001)
                  </p>
                </div>
              </div>

              {/* Quick Auto-Generate / Regenerate Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchGeneratedModelNumber(categoryId);
                    showNotify('success', 'Generated new model sequence!');
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Generate or refresh official model sequence from server"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto-Generate / Refresh Model</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80 items-center">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  OFFICIAL MODEL CODE (CONFIRMED / EDITABLE)
                </label>
                <input
                  type="text"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value.toUpperCase().trim())}
                  placeholder="e.g. SVG-MCC-2026-001"
                  className="w-full px-4 py-2 bg-slate-950/80 border border-slate-700 focus:border-blue-400 rounded-xl text-sm font-mono font-black text-amber-300 tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  SYSTEM VALIDATION STATUS
                </label>
                {!modelNumber ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Model number pending. Click auto-generate.</span>
                  </div>
                ) : isModelNumberTaken ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Already taken! Click auto-generate for next.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Unique & Valid for Save</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Summary Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">OFFICIAL MODEL</span>
                <span className="text-xs bg-blue-600 text-white font-mono px-2 py-0.5 rounded font-bold">
                  {modelNumber || 'NO MODEL NO'}
                </span>
              </div>

              <h3 className="text-xl font-black">{name || 'Unnamed Panel'}</h3>
              <p className="text-xs text-slate-400">{description || 'No description provided.'}</p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800 text-slate-300">
                <div>Dimensions: {enclosureHeight}×{enclosureWidth}×{enclosureDepth} mm</div>
                <div>Protection: {ipRating}</div>
                <div>Form Rating: {formRating}</div>
                <div>Total BOM Items: {bomItems.length} lines</div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>1. Fabrication (Enclosure):</span>
                  <span>₹{stage1Cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>2. Busbar System:</span>
                  <span>₹{stage2Cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>3. Wiring & Labor:</span>
                  <span>₹{stage3Cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bought-Out BOM Components:</span>
                  <span>₹{bomMaterialSum.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-blue-400 font-bold border-t border-slate-800 pt-1">
                  <span>Total Direct Cost:</span>
                  <span>₹{directManufacturingCost.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Right: Commercial Selling Price Card */}
            <div className="bg-emerald-50/60 border border-emerald-200 p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-mono text-emerald-800 font-bold uppercase tracking-wider">
                  COMMERCIAL SELLING PRICE
                </span>
                <p className="text-3xl font-black text-slate-900 mt-2 font-mono">
                  ₹{finalGrossPrice.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Final Estimation Price (Inclusive of 18% GST)</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Direct Cost:</span>
                  <span>₹{directManufacturingCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>FAT Testing & Drawings:</span>
                  <span>₹{(fatTestingCost + designEngineeringCost).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Factory Overheads:</span>
                  <span>₹{overheadCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1">
                  <span>Net Ex-Works Selling:</span>
                  <span>₹{finalExWorksPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Amount (18%):</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleSaveFinishedGood}
                disabled={savingFg}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{savingFg ? 'Saving Product...' : 'Save & Publish Product'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => goToTab('STAGES')}
              className="flex items-center gap-2 px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: The 4 Costing Stages</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROMPT MODAL: "SHALL I ADD THIS COMPONENT TO PRICE MASTER?" (YES / NO)    */}
      {/* ========================================================================= */}
      {unmappedPrompt.show && unmappedPrompt.item && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide">New Component Detected</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl space-y-1.5 text-xs text-blue-950">
                <p className="font-bold text-sm text-slate-900">{unmappedPrompt.item.description}</p>
                <div className="flex items-center gap-4 text-slate-600 font-mono">
                  <span>Make: <strong>{unmappedPrompt.item.make}</strong></span>
                  {unmappedPrompt.item.rating && <span>Rating: {unmappedPrompt.item.rating}</span>}
                </div>
                <div className="pt-1 text-emerald-800 font-mono font-bold text-sm">
                  Entered Unit Price: ₹{unmappedPrompt.enteredPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  Shall I add this component to the Central Price Master?
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Saving to Price Master will make this component and price automatically available for all future panels and engineers.
                </p>
              </div>

              {/* Extra data for Price Master */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Catalog Group</label>
                  <select
                    value={addMasterCategory}
                    onChange={(e) => setAddMasterCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="Switchgear & Protection">Switchgear & Protection</option>
                    <option value="Drives & Softstarters">Drives & Softstarters</option>
                    <option value="Automation & Control">Automation & Control</option>
                    <option value="Busbar Systems">Busbar Systems</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Enclosures">Enclosures</option>
                    <option value="Hardware & Accessories">Hardware & Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={addMasterHsn}
                    onChange={(e) => setAddMasterHsn(e.target.value)}
                    placeholder="8537"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* YES / NO Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDismissAddToMaster}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  No, This Product Alone
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAddToMaster}
                  className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Yes, Add to Price Master</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
