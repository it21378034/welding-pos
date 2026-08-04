import React, { useState, useRef } from 'react';
import type { Quotation, LineItem, CatalogItem, PriceVisibilityOptions } from '../types';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Printer, 
  Copy, 
  ArrowRightLeft, 
  Upload, 
  X, 
  Edit3, 
  Search,
  PenTool
} from 'lucide-react';

export const QuotationModule: React.FC = () => {
  const { 
    quotations, 
    addQuotation, 
    updateQuotation, 
    deleteQuotation, 
    duplicateQuotation, 
    convertQuotationToInvoice,
    customers, 
    catalogItems, 
    settings, 
    setActivePrintDocument, 
    t 
  } = useApp();

  const [activeView, setActiveView] = useState<'list' | 'editor'>('list');
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>(settings.defaultQuotationTerms);

  // Pricing Visibility Controls (CRITICAL FEATURE REQUIREMENT)
  const [visibility, setVisibility] = useState<PriceVisibilityOptions>({
    showPrices: true,
    showUnitPrice: true,
    showTotal: true,
  });

  // Attachments & Signature
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [customerSignature, setCustomerSignature] = useState<string | undefined>(undefined);
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Filter List View
  const [searchTerm, setSearchTerm] = useState('');

  const openNewQuotationEditor = () => {
    setEditingQuotationId(null);
    setSelectedCustomerId(customers[0]?.id || '');
    setProjectName('');
    setDate(new Date().toISOString().split('T')[0]);
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setItems([
      {
        id: 'li-' + Date.now(),
        name: catalogItems[0]?.name || 'Custom Metal Fabrication',
        unit: catalogItems[0]?.unit || 'Feet',
        quantity: 10,
        unitPrice: catalogItems[0]?.defaultPrice || 500,
        total: (catalogItems[0]?.defaultPrice || 500) * 10,
      },
    ]);
    setDiscount(0);
    setNotes('');
    setTerms(settings.defaultQuotationTerms);
    setVisibility({ showPrices: true, showUnitPrice: true, showTotal: true });
    setProjectImages([]);
    setCustomerSignature(undefined);
    setActiveView('editor');
  };

  const openEditQuotationEditor = (q: Quotation) => {
    setEditingQuotationId(q.id);
    setSelectedCustomerId(q.customerId);
    setProjectName(q.projectName);
    setDate(q.date);
    setValidUntil(q.validUntil);
    setItems(q.items);
    setDiscount(q.discount);
    setNotes(q.notes);
    setTerms(q.terms);
    setVisibility(q.visibility);
    setProjectImages(q.projectImages || []);
    setCustomerSignature(q.customerSignature);
    setActiveView('editor');
  };

  // Line item helpers
  const handleAddItem = (catalogItem?: CatalogItem) => {
    const newItem: LineItem = {
      id: 'li-' + Date.now() + Math.random().toString().slice(2, 5),
      name: catalogItem ? catalogItem.name : '',
      unit: catalogItem ? catalogItem.unit : 'Feet',
      quantity: 1,
      unitPrice: catalogItem ? catalogItem.defaultPrice : 0,
      total: catalogItem ? catalogItem.defaultPrice : 0,
      description: catalogItem ? catalogItem.description : '',
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateLineItem = (id: string, field: keyof LineItem, val: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? parseFloat(val) || 0 : item.quantity;
          const price = field === 'unitPrice' ? parseFloat(val) || 0 : item.unitPrice;
          updated.total = qty * price;
        }
        return updated;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProjectImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = sigCanvasRef.current;
    if (canvas) {
      setCustomerSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setCustomerSignature(undefined);
  };

  // Subtotals
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const taxAmount = (subtotal - discount) * (settings.taxPercentage / 100);
  const grandTotal = subtotal - discount + taxAmount;

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) {
      alert('Please select a valid customer!');
      return;
    }

    const quotationPayload = {
      date,
      validUntil,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      customerEmail: cust.email,
      projectName,
      items,
      subtotal,
      taxRate: settings.taxPercentage,
      taxAmount,
      discount,
      grandTotal,
      notes,
      terms,
      visibility,
      status: 'draft' as const,
      projectImages,
      customerSignature,
    };

    if (editingQuotationId) {
      updateQuotation(editingQuotationId, quotationPayload);
    } else {
      addQuotation(quotationPayload);
    }

    setActiveView('list');
  };

  const filteredQuotations = quotations.filter(
    q =>
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            {t('quotationModule')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build custom quotations with price visibility toggles (Show/Hide Prices for estimates).
          </p>
        </div>

        {activeView === 'list' ? (
          <button
            onClick={openNewQuotationEditor}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createQuotation')}</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            <X className="w-4 h-4" />
            <span>Back to List</span>
          </button>
        )}
      </div>

      {/* LIST VIEW */}
      {activeView === 'list' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm transition"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[900px]">
                <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">{t('quotationNumber')}</th>
                    <th className="py-3.5 px-4">{t('customerName')}</th>
                    <th className="py-3.5 px-4">{t('projectName')}</th>
                    <th className="py-3.5 px-4">{t('date')}</th>
                    <th className="py-3.5 px-4 text-right">{t('grandTotal')}</th>
                    <th className="py-3.5 px-4 text-center">Visibility</th>
                    <th className="py-3.5 px-4 text-center">{t('quotationStatus')}</th>
                    <th className="py-3.5 px-4 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredQuotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{q.quotationNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-100">{q.customerName}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate">{q.projectName}</td>
                      <td className="py-3 px-4 text-slate-400">{q.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100 text-right">
                        {q.visibility.showPrices ? `${settings.currency} ${q.grandTotal.toLocaleString()}` : '(Hidden)'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {q.visibility.showPrices ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                            <Eye className="w-3 h-3" /> Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold">
                            <EyeOff className="w-3 h-3" /> Prices Hidden
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            q.status === 'converted'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : q.status === 'sent'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setActivePrintDocument({ type: 'quotation', data: q, layout: 'a4' })}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                          title={t('printA4')}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateQuotation(q.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                          title={t('duplicateQuotation')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {q.status !== 'converted' && (
                          <button
                            onClick={() => convertQuotationToInvoice(q.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                            title={t('convertToInvoice')}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditQuotationEditor(q)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('confirmDelete'))) deleteQuotation(q.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
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
        </div>
      )}

      {/* EDITOR VIEW (Create / Edit Quotation Form) */}
      {activeView === 'editor' && (
        <form onSubmit={handleSaveQuotation} className="space-y-6">
          {/* Section 1: Customer & Basic Details */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3">
              1. Customer & Project Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('selectCustomer')} *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('projectName')} *</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Stainless Steel Balcony Railing & Gate Work"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('date')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('validUntil')}</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: CRITICAL FEATURE REQUIREMENT - Price Visibility Toggles */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-xl space-y-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-amber-400 text-base flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t('priceVisibility')} (Customer Print Controls)
              </h3>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Special Workshop Feature
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{t('pricingNote')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={visibility.showPrices}
                  onChange={e =>
                    setVisibility(prev => ({
                      ...prev,
                      showPrices: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-extrabold text-slate-100 block">{t('showPrices')}</span>
                  <span className="text-[10px] text-slate-400">Master price toggle</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={visibility.showUnitPrice}
                  onChange={e =>
                    setVisibility(prev => ({
                      ...prev,
                      showUnitPrice: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-extrabold text-slate-100 block">{t('showUnitPrice')}</span>
                  <span className="text-[10px] text-slate-400">Display unit rate column</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 cursor-pointer hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={visibility.showTotal}
                  onChange={e =>
                    setVisibility(prev => ({
                      ...prev,
                      showTotal: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-extrabold text-slate-100 block">{t('showTotal')}</span>
                  <span className="text-[10px] text-slate-400">Display grand total sum</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Line Items Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-100 text-base">2. Itemized Materials & Services</h3>
              <div className="flex items-center gap-2">
                <select
                  onChange={e => {
                    const found = catalogItems.find(ci => ci.id === e.target.value);
                    if (found) handleAddItem(found);
                    e.target.value = '';
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">+ Add Preset Catalog Item</option>
                  {catalogItems.map(ci => (
                    <option key={ci.id} value={ci.id}>
                      {ci.name} ({settings.currency} {ci.defaultPrice}/{ci.unit})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    handleAddItem({
                      id: 'item-qd-paint',
                      name: 'Quick Drying Primer Paint (QD Paint - 4L Can)',
                      unit: 'Liters',
                      defaultPrice: 2200,
                      description: '4L QD Paint (LKR 2,200/Liters)',
                      category: 'material',
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                >
                  🎨 + Add QD Paint (4L / LKR 2200)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem()}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Custom Item
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Item Name #{idx + 1}
                    </label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={e => handleUpdateLineItem(item.id, 'name', e.target.value)}
                      placeholder="Item name / specs"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={item.unit}
                      onChange={e => handleUpdateLineItem(item.id, 'unit', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantity</label>
                    <input
                      type="number"
                      required
                      min={0.1}
                      step={0.1}
                      value={item.quantity}
                      onChange={e => handleUpdateLineItem(item.id, 'quantity', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit Price</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={item.unitPrice}
                      onChange={e => handleUpdateLineItem(item.id, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-2 pt-2 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
                      <span className="text-xs font-mono font-extrabold text-amber-400">
                        {settings.currency} {item.total.toLocaleString()}
                      </span>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(item.id)}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Box */}
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{t('subtotal')}:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {settings.currency} {subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>{t('discount')}:</span>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-right font-mono text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {settings.taxPercentage > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax ({settings.taxPercentage}%):</span>
                    <span className="font-mono font-bold text-slate-200">
                      {settings.currency} {taxAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-slate-100 pt-2 border-t border-slate-800">
                  <span>{t('grandTotal')}:</span>
                  <span className="font-mono text-amber-400 text-base">
                    {settings.currency} {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Attachments & Customer Signature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drawing / Image Uploads */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                {t('projectImages')}
              </h3>

              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-300">Upload Drawing / Project Photo</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>

              {projectImages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {projectImages.map((img, idx) => (
                    <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-700">
                      <img src={img} alt="Drawing" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setProjectImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signature Capture Canvas */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  {t('customerSignature')}
                </h3>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-xs font-semibold text-rose-400 hover:underline"
                >
                  {t('clearSignature')}
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 flex justify-center">
                <canvas
                  ref={sigCanvasRef}
                  width={340}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="border border-slate-800 rounded bg-slate-950 cursor-crosshair touch-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Notes & Terms */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3">
              3. Notes & Terms
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('notes')}</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Special instructions, gate height details..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('termsConditions')}</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-semibold transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              {t('save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
