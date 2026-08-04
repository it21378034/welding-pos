import React, { useState } from 'react';
import type { Invoice } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Receipt, 
  Printer, 
  CreditCard, 
  Search, 
  Trash2, 
  X
} from 'lucide-react';

export const InvoiceModule: React.FC = () => {
  const { invoices, recordPayment, deleteInvoice, settings, setActivePrintDocument, t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'cheque'>('cash');
  const [paymentNote, setPaymentNote] = useState<string>('');

  const handleOpenPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentMethod('cash');
    setPaymentNote('');
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) return;

    recordPayment(selectedInvoice.id, {
      amount: paymentAmount,
      method: paymentMethod,
      note: paymentNote,
    });

    setIsPaymentModalOpen(false);
  };

  const filteredInvoices = invoices.filter(
    inv =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-400" />
            {t('invoiceModule')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track payments, partial deposits, balance due & thermal receipts.
          </p>
        </div>
      </div>

      {/* Search */}
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

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{t('invoiceNumber')}</th>
                <th className="py-3.5 px-4">{t('customerName')}</th>
                <th className="py-3.5 px-4">{t('projectName')}</th>
                <th className="py-3.5 px-4">{t('date')}</th>
                <th className="py-3.5 px-4 text-right">{t('grandTotal')}</th>
                <th className="py-3.5 px-4 text-right">{t('paidAmount')}</th>
                <th className="py-3.5 px-4 text-right">{t('balanceDue')}</th>
                <th className="py-3.5 px-4 text-center">{t('paymentStatus')}</th>
                <th className="py-3.5 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-100">{inv.customerName}</td>
                  <td className="py-3 px-4 text-slate-400 max-w-[180px] truncate">{inv.projectName}</td>
                  <td className="py-3 px-4 text-slate-400">{inv.date}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-100 text-right">
                    {settings.currency} {inv.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-right">
                    {settings.currency} {inv.paidAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-400 text-right">
                    {settings.currency} {inv.balanceDue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : inv.status === 'partially_paid'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    {inv.balanceDue > 0 && (
                      <button
                        onClick={() => handleOpenPaymentModal(inv)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition"
                        title={t('recordPayment')}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setActivePrintDocument({ type: 'invoice', data: inv, layout: 'a4' })}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-slate-950 transition"
                      title={t('printA4')}
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActivePrintDocument({ type: 'invoice', data: inv, layout: 'thermal' })}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                      title={t('printThermal')}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('confirmDelete'))) deleteInvoice(inv.id);
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                {t('recordPayment')}
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-mono font-bold text-blue-400">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-100">{selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-700">
                <span className="text-slate-400">Remaining Balance:</span>
                <span className="font-mono font-black text-rose-400">
                  {settings.currency} {selectedInvoice.balanceDue.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Payment Amount *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedInvoice.balanceDue}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-base font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('paymentMethod')}</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">{t('cash')}</option>
                  <option value="bank_transfer">{t('bankTransfer')}</option>
                  <option value="card">{t('card')}</option>
                  <option value="cheque">{t('cheque')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  placeholder="Reference number or note..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-semibold transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black shadow-lg shadow-emerald-500/20 transition"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
