import React, { useState } from 'react';
import {
  ShoppingCart, Plus, Trash2, Printer, X, Download,
  Package, User, Calendar, ClipboardList, Edit3, Save, Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PurchaseItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  notes?: string;
}

interface PurchaseList {
  id: string;
  listNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  projectName: string;
  items: PurchaseItem[];
  notes: string;
  createdAt: string;
}

// ─── Print Preview Component ─────────────────────────────────────────────────
const PurchasePrintView: React.FC<{
  list: PurchaseList;
  layout: 'a4' | 'thermal';
  onClose: () => void;
}> = ({ list, layout, onClose }) => {
  const { settings } = useApp();

  const handleNativePrint = () => window.print();

  const handleDownloadPDF = async () => {
    const el = document.getElementById('purchase-printable-area');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', layout === 'thermal' ? [80, 250] : 'a4');
    const imgWidth = layout === 'thermal' ? 72 : 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', layout === 'thermal' ? 4 : 0, 0, imgWidth, imgHeight);
    pdf.save(`PurchaseList_${list.listNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-4 sm:p-8 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Control Bar */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-2xl flex items-center justify-between print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm">
              Print Preview: {list.listNumber}
            </h3>
            <p className="text-[11px] text-slate-400">
              Layout: <span className="uppercase font-mono text-amber-400">{layout}</span> | Hardware Purchase List
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleNativePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Document */}
      <div
        id="purchase-printable-area"
        className={`bg-white text-slate-900 shadow-2xl print:shadow-none print:m-0 print:w-full ${
          layout === 'thermal'
            ? settings.thermalPrinterWidth === '58mm'
              ? 'w-[58mm] p-3 text-[10px]'
              : 'w-[80mm] p-4 text-[11px]'
            : 'w-full max-w-4xl p-10 text-xs rounded-xl'
        }`}
      >
        {/* ── A4 Layout ───────────────────────────────────────────────────── */}
        {layout === 'a4' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div className="flex items-start gap-4">
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt="Logo"
                  className="w-16 h-16 object-contain rounded-full border border-slate-300 p-0.5 shrink-0"
                />
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">{settings.name}</h1>
                  <p className="text-xs font-medium text-slate-600 italic">{settings.tagline}</p>
                  <p className="text-xs text-slate-700 pt-0.5">{settings.address}</p>
                  <p className="text-xs text-slate-700 font-mono">
                    Tel: {settings.phone1}{settings.phone2 ? ` / ${settings.phone2}` : ''} | {settings.email}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wide">PURCHASE LIST</h2>
                <p className="font-mono text-base font-bold text-amber-600">{list.listNumber}</p>
                <p className="text-xs text-slate-600">Date: <span className="font-semibold">{list.date}</span></p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">CUSTOMER DETAILS</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{list.customerName || '—'}</p>
                <p className="text-xs font-mono font-semibold text-slate-700">{list.customerPhone}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">PROJECT / PURPOSE</span>
                <p className="text-xs font-extrabold text-slate-900 mt-0.5 leading-snug">{list.projectName || '—'}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-800 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-2.5 px-2 w-8">#</th>
                  <th className="py-2.5 px-2">Item / Material Description</th>
                  <th className="py-2.5 px-2 text-center w-16">Unit</th>
                  <th className="py-2.5 px-2 text-center w-16">Qty</th>
                  {/* Correction / check box column */}
                  <th className="py-2.5 px-2 text-center w-24">Collected ✓</th>
                  <th className="py-2.5 px-2 text-center w-24">Checked ✓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-3 px-2 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <p className="font-extrabold text-slate-900 text-xs">{item.name}</p>
                      {item.notes && <p className="text-[11px] text-slate-500 italic">{item.notes}</p>}
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-slate-700">{item.unit}</td>
                    <td className="py-3 px-2 text-center font-mono font-black text-slate-900 text-sm">{item.quantity}</td>
                    {/* Hardware correction boxes */}
                    <td className="py-3 px-2 text-center">
                      <div className="w-8 h-8 border-2 border-slate-700 rounded mx-auto" />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="w-8 h-8 border-2 border-slate-700 rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes */}
            {list.notes && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h4 className="font-bold text-xs text-slate-900 uppercase mb-1">Notes / Instructions</h4>
                <p className="text-xs text-slate-700 whitespace-pre-line">{list.notes}</p>
              </div>
            )}

            {/* Footer signature */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-[11px]">
              <div className="text-center">
                <div className="h-10 border-b-2 border-slate-600 mb-1" />
                <p className="font-semibold text-slate-600 uppercase text-[10px]">Prepared By</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b-2 border-slate-600 mb-1" />
                <p className="font-semibold text-slate-600 uppercase text-[10px]">Hardware Verified By</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b-2 border-slate-600 mb-1" />
                <p className="font-semibold text-slate-600 uppercase text-[10px]">Customer Received</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Thermal Layout ───────────────────────────────────────────────── */}
        {layout === 'thermal' && (
          <div className="space-y-2 font-mono">
            {/* Header with Logo */}
            <div className="text-center border-b border-black pb-2 flex flex-col items-center">
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="Logo"
                className="w-12 h-12 mb-1 object-contain rounded-full border border-black p-0.5"
              />
              <h2 className="font-black text-sm uppercase">{settings.name}</h2>
              <p className="text-[9px]">{settings.address}</p>
              <p className="text-[9px]">Tel: {settings.phone1}</p>
            </div>

            <div className="text-center border-b border-black pb-1.5">
              <p className="font-black uppercase text-xs">PURCHASE LIST</p>
              <p className="font-bold text-[10px]">{list.listNumber}</p>
              <p className="text-[9px]">{list.date}</p>
            </div>

            <div className="border-b border-black pb-1.5">
              <p className="font-bold text-[10px]">Client: {list.customerName || '—'}</p>
              {list.customerPhone && <p className="text-[9px]">Tel: {list.customerPhone}</p>}
              {list.projectName && <p className="text-[9px]">Project: {list.projectName}</p>}
            </div>

            <table className="w-full text-left text-[9px]">
              <thead>
                <tr className="border-b border-black">
                  <th className="w-5 text-center">#</th>
                  <th>Item</th>
                  <th className="text-center w-10">Qty</th>
                  {/* Correction checkbox column for hardware */}
                  <th className="text-center w-8">[ ]</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-dashed border-slate-300">
                    <td className="py-1 text-center">{idx + 1}</td>
                    <td className="py-1 pr-1 font-semibold leading-tight">
                      {item.name}
                      <span className="text-[8px] font-normal text-slate-600 block">{item.unit}</span>
                    </td>
                    <td className="py-1 text-center font-black">{item.quantity}</td>
                    <td className="py-1 text-center">
                      {/* Hardware correction checkbox box */}
                      <span className="inline-block w-4 h-4 border-2 border-black align-middle" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {list.notes && (
              <div className="border-t border-black pt-1 text-[9px]">
                <p className="font-bold">Notes:</p>
                <p>{list.notes}</p>
              </div>
            )}

            <div className="text-center pt-2 border-t border-dashed border-black text-[9px] space-y-0.5">
              <p className="font-bold">THANK YOU!</p>
              <p>{settings.tagline}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Purchase List Form ──────────────────────────────────────────────────────
const UNITS = ['Nos', 'Kg', 'Feet', 'Meters', 'Sq Ft', 'Liters', 'Bags', 'Sheets', 'Rolls', 'Boxes', 'Pairs', 'Sets'];

const emptyItem = (): PurchaseItem => ({
  id: 'pi-' + Date.now() + Math.random(),
  name: '',
  unit: 'Nos',
  quantity: 1,
  notes: '',
});

let listCounter = 1;
const generateListNumber = () => {
  const num = String(listCounter++).padStart(3, '0');
  return `PL-${new Date().getFullYear()}-${num}`;
};

// ─── Main Module ─────────────────────────────────────────────────────────────
export const PurchaseListModule: React.FC = () => {
  const { customers } = useApp();

  const [lists, setLists] = useState<PurchaseList[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([emptyItem()]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Print state
  const [printTarget, setPrintTarget] = useState<{ list: PurchaseList; layout: 'a4' | 'thermal' } | null>(null);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setProjectName('');
    setNotes('');
    setItems([emptyItem()]);
    setCustomerSearch('');
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (list: PurchaseList) => {
    setCustomerName(list.customerName);
    setCustomerPhone(list.customerPhone);
    setProjectName(list.projectName);
    setNotes(list.notes);
    setItems(list.items.map(i => ({ ...i })));
    setCustomerSearch(list.customerName);
    setEditingId(list.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (items.filter(i => i.name.trim()).length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const validItems = items.filter(i => i.name.trim() !== '');

    if (editingId) {
      setLists(prev => prev.map(l => l.id === editingId ? {
        ...l,
        customerName,
        customerPhone,
        projectName,
        notes,
        items: validItems,
      } : l));
    } else {
      const newList: PurchaseList = {
        id: 'pl-' + Date.now(),
        listNumber: generateListNumber(),
        date: new Date().toISOString().split('T')[0],
        customerName,
        customerPhone,
        projectName,
        notes,
        items: validItems,
        createdAt: new Date().toISOString(),
      };
      setLists(prev => [newList, ...prev]);
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this purchase list?')) {
      setLists(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleDuplicate = (list: PurchaseList) => {
    const dup: PurchaseList = {
      ...list,
      id: 'pl-' + Date.now(),
      listNumber: generateListNumber(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    setLists(prev => [dup, ...prev]);
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, field: keyof PurchaseItem, value: string | number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print overlay */}
      {printTarget && (
        <PurchasePrintView
          list={printTarget.list}
          layout={printTarget.layout}
          onClose={() => setPrintTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            Hardware Purchase Lists
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create item lists for customers to buy hardware materials. No prices shown — just items & quantities with check boxes.
          </p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Purchase List
        </button>
      </div>

      {/* ── Form Modal ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 py-8">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-100">
                    {editingId ? 'Edit Purchase List' : 'New Purchase List'}
                  </h3>
                  <p className="text-xs text-slate-400">Fill customer info and add items. Prices are NOT included.</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Customer Section */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-4">
                <h4 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" /> Customer Info
                </h4>

                {/* Customer search / autocomplete */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setCustomerName(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                    placeholder="Type to search or enter name..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => {
                            setCustomerName(c.name);
                            setCustomerPhone(c.phone);
                            setCustomerSearch(c.name);
                            setShowCustomerDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition"
                        >
                          <span className="font-semibold">{c.name}</span>
                          <span className="ml-2 text-slate-400 text-xs">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="077 xxx xxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Project / Purpose</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                      placeholder="e.g. Gate fabrication, Roofing..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-100 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" /> Items to Purchase
                  </h4>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs transition border border-amber-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_40px] gap-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Item / Material Name</span>
                  <span className="text-center">Unit</span>
                  <span className="text-center">Quantity</span>
                  <span>Notes (optional)</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_40px] gap-2 items-center bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-xs w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateItem(item.id, 'name', e.target.value)}
                          placeholder="e.g. MS Box Bar 2x2"
                          className="flex-1 bg-transparent text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none border-b border-slate-600 focus:border-amber-500 py-1 transition"
                        />
                      </div>
                      <select
                        value={item.unit}
                        onChange={e => updateItem(item.id, 'unit', e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-slate-100 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                        className="bg-slate-700 border border-slate-600 text-slate-100 text-sm font-mono rounded-lg px-2 py-1.5 text-center focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={e => updateItem(item.id, 'notes', e.target.value)}
                        placeholder="Optional note..."
                        className="bg-transparent text-slate-400 text-xs placeholder:text-slate-600 focus:outline-none border-b border-slate-700 focus:border-amber-500 py-1 transition"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Notes / Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Please bring exact items. No substitutions."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Save Changes' : 'Create List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── List Table ────────────────────────────────────────────────────── */}
      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-5 rounded-2xl bg-amber-500/10 text-amber-400 mb-4">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-black text-slate-100">No Purchase Lists Yet</h3>
          <p className="text-slate-400 text-sm mt-1">Create your first list to give customers a hardware shopping guide.</p>
          <button
            onClick={openNewForm}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition"
          >
            <Plus className="w-4 h-4" /> New Purchase List
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-100 text-base">{list.listNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-300 mt-0.5">{list.customerName || 'No customer'}</p>
                    {list.projectName && <p className="text-xs text-slate-500">{list.projectName}</p>}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {list.date}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                  <button
                    onClick={() => setPrintTarget({ list, layout: 'thermal' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 font-semibold text-xs border border-slate-700 transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Thermal
                  </button>
                  <button
                    onClick={() => setPrintTarget({ list, layout: 'a4' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/20 transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> A4 Print
                  </button>
                  <button
                    onClick={() => openEditForm(list)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-700 transition"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(list)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-700 transition"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Item preview pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {list.items.slice(0, 6).map(item => (
                  <span key={item.id} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs border border-slate-700">
                    {item.name} × {item.quantity} {item.unit}
                  </span>
                ))}
                {list.items.length > 6 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-xs border border-slate-700">
                    +{list.items.length - 6} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
