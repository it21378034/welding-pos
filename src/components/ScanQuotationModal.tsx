import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  Key, 
  FileText, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  Eye,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Customer, LineItem, Quotation } from '../types';
import { 
  analyzeHandwrittenBillImage, 
  fileToBase64, 
  getGeminiApiKey, 
  saveGeminiApiKey, 
  SAMPLE_HANDWRITTEN_BILL_DATA,
  type ScannedMaterialItem 
} from '../lib/geminiVisionService';

interface ScanQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuotationCreated?: (quotation: Quotation) => void;
}

export const ScanQuotationModal: React.FC<ScanQuotationModalProps> = ({
  isOpen,
  onClose,
  onQuotationCreated,
}) => {
  const { customers, addQuotation, settings, updateSettings } = useApp();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Editable Form fields extracted from image
  const [projectName, setProjectName] = useState<string>('Sliding Gate Fabrication');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<ScannedMaterialItem[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [handwrittenTotal, setHandwrittenTotal] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentKey = getGeminiApiKey(settings.geminiApiKey);
      setApiKey(currentKey);
      if (!currentKey) {
        setShowKeyInput(true);
      }
      if (customers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customers[0].id);
      }
    }
  }, [isOpen, settings.geminiApiKey, customers, selectedCustomerId]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    saveGeminiApiKey(apiKey);
    updateSettings({ geminiApiKey: apiKey.trim() });
    setShowKeyInput(false);
    setScanError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScanError(null);
      const base64 = await fileToBase64(file);
      setImageSrc(base64);
      processImage(base64);
    } catch (err: any) {
      setScanError('Failed to read image file: ' + err.message);
    }
  };

  const loadSampleBill = async () => {
    try {
      setScanError(null);
      // Fetch sample image from public folder
      const res = await fetch('/samples/handwritten_gate_bill.jpg');
      const blob = await res.blob();
      const base64 = await fileToBase64(new File([blob], 'handwritten_gate_bill.jpg', { type: 'image/jpeg' }));
      setImageSrc(base64);
      processImage(base64, true);
    } catch (err: any) {
      // Fallback: direct sample data
      setImageSrc('/samples/handwritten_gate_bill.jpg');
      applyParsedData(SAMPLE_HANDWRITTEN_BILL_DATA);
      setHasScanned(true);
    }
  };

  const processImage = async (base64Image: string, isSample = false) => {
    setIsScanning(true);
    setScanError(null);

    const activeKey = getGeminiApiKey(apiKey || settings.geminiApiKey);

    // If no API key is provided and user is testing sample, use pre-calculated verified data
    if (!activeKey && isSample) {
      setTimeout(() => {
        applyParsedData(SAMPLE_HANDWRITTEN_BILL_DATA);
        setIsScanning(false);
        setHasScanned(true);
      }, 1200);
      return;
    }

    if (!activeKey) {
      setIsScanning(false);
      setShowKeyInput(true);
      setScanError('Please enter your free Google Gemini API Key below to scan handwritten notes with AI.');
      return;
    }

    try {
      const result = await analyzeHandwrittenBillImage(base64Image, activeKey);
      applyParsedData(result);
      setHasScanned(true);
    } catch (err: any) {
      console.error('Scan error:', err);
      if (err.message === 'MISSING_API_KEY') {
        setShowKeyInput(true);
        setScanError('Please enter your free Google Gemini API Key.');
      } else {
        setScanError(`AI Scan Failed: ${err.message}. You can also test with the built-in sample note.`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const applyParsedData = (data: typeof SAMPLE_HANDWRITTEN_BILL_DATA) => {
    setProjectName(data.projectName || 'Fabrication & Metal Works');
    setItems(
      data.items.map((item, index) => ({
        ...item,
        id: item.id || `item-${Date.now()}-${index}`,
      }))
    );
    setHandwrittenTotal(data.grandTotal || data.subtotal);
    setNotes(data.notes || 'Scanned from handwritten workshop material list');
  };

  const handleItemChange = (id: string | undefined, field: keyof ScannedMaterialItem, val: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? parseFloat(val) || 0 : it.quantity;
          const price = field === 'unitPrice' ? parseFloat(val) || 0 : it.unitPrice;
          updated.total = Math.round(qty * price);
        } else if (field === 'total') {
          const tot = parseFloat(val) || 0;
          updated.total = tot;
          if (it.quantity > 0) {
            updated.unitPrice = Math.round((tot / it.quantity) * 100) / 100;
          }
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: ScannedMaterialItem = {
      id: `item-${Date.now()}`,
      name: 'New Material Item',
      unit: 'Nos',
      quantity: 1,
      unitPrice: 1000,
      total: 1000,
      description: '',
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleDeleteItem = (id?: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const calculatedSubtotal = items.reduce((sum, it) => sum + it.total, 0);

  const handleCreateQuotation = () => {
    if (items.length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const selectedCust = customers.find(c => c.id === selectedCustomerId) || customers[0] || {
      id: 'walk-in',
      name: 'Walk-in Customer',
      phone: '077 000 0000',
      address: 'Workshop Counter',
    };

    const lineItems: LineItem[] = items.map((it, idx) => ({
      id: `li-${Date.now()}-${idx}`,
      name: it.name,
      unit: it.unit || 'Nos',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      total: it.total,
      description: it.description || '',
    }));

    const subtotal = calculatedSubtotal;
    const taxRate = settings.taxPercentage || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    const newQuotation = addQuotation({
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customerId: selectedCust.id,
      customerName: selectedCust.name,
      customerPhone: selectedCust.phone,
      customerAddress: selectedCust.address,
      customerEmail: (selectedCust as Customer).email,
      projectName: projectName || 'Metal Fabrication & Materials',
      items: lineItems,
      subtotal,
      taxRate,
      taxAmount,
      discount: 0,
      grandTotal,
      notes: notes || 'Generated from handwritten bill scan',
      terms: settings.defaultQuotationTerms,
      visibility: {
        showPrices: true,
        showUnitPrice: true,
        showTotal: true,
      },
      status: 'draft',
      projectImages: imageSrc ? [imageSrc] : [],
    });

    onClose();
    if (onQuotationCreated) {
      onQuotationCreated(newQuotation);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100 tracking-tight">
                  AI Note & Bill Scanner to Quotation
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Vision AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload or photograph handwritten welding notes or hardware bills to generate a full quotation instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                getGeminiApiKey(apiKey || settings.geminiApiKey)
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {getGeminiApiKey(apiKey || settings.geminiApiKey) ? 'API Key Active' : 'Set API Key'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Banner/Drawer */}
        {showKeyInput && (
          <div className="px-6 py-3.5 bg-amber-500/10 border-b border-amber-500/20 text-slate-200 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Google Gemini API Key (Vision AI)
                </p>
                <p className="text-slate-400 text-[11px]">
                  Requires a free API key from Google AI Studio. Free tier includes generous monthly vision requests.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste AI Studio API Key (AIzaSy...)"
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400 w-56 sm:w-64"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition shrink-0"
                >
                  Save Key
                </button>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Get a free Gemini API Key"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Error Alert */}
          {scanError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <p className="font-bold">Scan Notice</p>
                  <p className="text-[11px] opacity-90">{scanError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadSampleBill}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow transition cursor-pointer"
              >
                Load Gate Note Items (66,500 LKR)
              </button>
            </div>
          )}

          {/* Upload and Capture Options Area */}
          {!hasScanned && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Drop / Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="md:col-span-2 group relative border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/40 hover:bg-slate-950/70 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 transition border border-amber-500/20 group-hover:scale-110">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-100 mb-1">
                  Upload Handwritten Note or Bill
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Drag and drop your JPG or PNG image here, or browse files on your computer or phone.
                </p>
              </div>

              {/* Direct Camera & Preset Actions */}
              <div className="flex flex-col gap-3">
                {/* Take Photo button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 p-5 rounded-3xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 flex flex-col items-center justify-center text-center transition group"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">Take Photo with Camera</span>
                  <span className="text-[10px] text-slate-400">Capture notebook page or paper bill</span>
                </button>

                {/* Instant Sample Note Button */}
                <button
                  type="button"
                  onClick={loadSampleBill}
                  className="p-4 rounded-3xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-3 text-left transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-amber-300">
                      Try Sample Gate Bill
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      15 items note: Box bars, angle iron, rollers, rivets (66,500 LKR)
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Scanning Animation State */}
          {isScanning && (
            <div className="p-8 rounded-3xl bg-slate-950/60 border border-amber-500/30 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-28 h-36 rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt="Scanning"
                    className="w-full h-full object-cover filter blur-[0.5px]"
                  />
                )}
                {/* Glowing Laser Scan Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-100 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  Analyzing Handwriting with AI...
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Reading welding dimensions, box bar gauges, quantities, units, and item prices from your document.
                </p>
              </div>
            </div>
          )}

          {/* Scanned & Verified Results Table */}
          {hasScanned && !isScanning && (
            <div className="space-y-6">
              {/* Header Details (Project, Customer, Date) */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Project / Work Title
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. Main Sliding Gate Fabrication"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Select Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Attached Document Photo
                  </label>
                  <div className="flex items-center gap-2">
                    {imageSrc && (
                      <div className="relative group w-12 h-9 rounded-lg overflow-hidden border border-slate-700 shrink-0 cursor-pointer">
                        <img src={imageSrc} alt="Scanned Document" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setHasScanned(false);
                        setImageSrc(null);
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      Rescan / Change Image
                    </button>
                  </div>
                </div>
              </div>

              {/* Extracted Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
                      Extracted Material Items ({items.length} Items)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs transition border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 w-8">#</th>
                          <th className="py-2.5 px-3 min-w-[220px]">Item Description & Specs</th>
                          <th className="py-2.5 px-3 w-24">Unit</th>
                          <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                          <th className="py-2.5 px-3 w-28 text-right">Unit Price ({settings.currency})</th>
                          <th className="py-2.5 px-3 w-28 text-right">Line Total ({settings.currency})</th>
                          <th className="py-2.5 px-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {items.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-800/30 transition">
                            <td className="py-2 px-3 text-slate-500 font-sans text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={it.name}
                                onChange={e => handleItemChange(it.id, 'name', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-sans focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={it.unit}
                                onChange={e => handleItemChange(it.id, 'unit', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-100 font-sans focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={it.quantity}
                                onChange={e => handleItemChange(it.id, 'quantity', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-right focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={it.unitPrice}
                                onChange={e => handleItemChange(it.id, 'unitPrice', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-right focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                value={it.total}
                                onChange={e => handleItemChange(it.id, 'total', e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded-lg bg-slate-900 border border-amber-500/30 text-amber-300 font-bold text-right focus:outline-none focus:border-amber-400"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(it.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400">
                    {handwrittenTotal > 0 && (
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-medium text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        Handwritten Paper Total: {settings.currency} {handwrittenTotal.toLocaleString()}
                        {handwrittenTotal === calculatedSubtotal ? ' (100% Match)' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mr-3">
                      Quotation Grand Total:
                    </span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {settings.currency} {calculatedSubtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Cancel
          </button>

          {hasScanned && (
            <button
              type="button"
              onClick={handleCreateQuotation}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Create Quotation Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
