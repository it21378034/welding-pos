import React from 'react';
import { 
  FileText, 
  Receipt, 
  TrendingUp, 
  Clock, 
  FilePlus, 
  ReceiptText, 
  Users, 
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Dashboard: React.FC = () => {
  const { quotations, invoices, customers, settings, setActiveTab, t } = useApp();

  // Metrics Calculations
  const totalQuotationsCount = quotations.length;
  const totalInvoicesCount = invoices.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlySalesAmount = invoices
    .filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    })
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const pendingPaymentsAmount = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const recentCustomersList = customers.slice(0, 5);
  const recentQuotationsList = quotations.slice(0, 5);
  const recentInvoicesList = invoices.slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/30 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <img 
            src={settings.logoUrl || '/logo.png'} 
            alt="Logo" 
            className="w-14 h-14 object-contain rounded-full bg-slate-900 border-2 border-amber-500/40 p-0.5 shrink-0 shadow-lg"
          />
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              {settings.name} Control Panel
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Manage custom fabrication quotes, pending payments, thermal receipts & customer invoices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('quotations')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <FilePlus className="w-4 h-4" />
            <span>{t('newQuotation')}</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition active:scale-95"
          >
            <ReceiptText className="w-4 h-4 text-amber-400" />
            <span>{t('newInvoice')}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Quotations */}
        <div 
          onClick={() => setActiveTab('quotations')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('totalQuotations')}</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-100">{totalQuotationsCount}</span>
            <span className="text-xs font-medium text-amber-400 flex items-center gap-0.5">
              Quotes <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Invoices */}
        <div 
          onClick={() => setActiveTab('invoices')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('totalInvoices')}</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-950 transition">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-100">{totalInvoicesCount}</span>
            <span className="text-xs font-medium text-blue-400 flex items-center gap-0.5">
              Invoices <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Monthly Sales */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('monthlySales')}</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-100">
              {settings.currency} {monthlySalesAmount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-400">This Month</span>
          </div>
        </div>

        {/* Card 4: Pending Payments */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('pendingPayments')}</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-950 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400">
              {settings.currency} {pendingPaymentsAmount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-0.5">
              Balance Due <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Quotations & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations Table */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                {t('recentQuotations')}
              </h3>
              <button
                onClick={() => setActiveTab('quotations')}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentQuotationsList.map(q => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800/80 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{q.quotationNumber}</span>
                      <span className="text-slate-200 text-xs font-semibold truncate max-w-[160px]">
                        {q.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{q.projectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-100">
                      {q.visibility.showPrices ? `${settings.currency} ${q.grandTotal.toLocaleString()}` : '(Prices Hidden)'}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        q.status === 'converted'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : q.status === 'sent'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                {t('recentInvoices')}
              </h3>
              <button
                onClick={() => setActiveTab('invoices')}
                className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentInvoicesList.map(inv => (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800/80 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">{inv.invoiceNumber}</span>
                      <span className="text-slate-200 text-xs font-semibold truncate max-w-[160px]">
                        {inv.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{inv.projectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-100">
                      {settings.currency} {inv.grandTotal.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        inv.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : inv.status === 'partially_paid'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Recent Customers List */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            {t('recentCustomers')}
          </h3>
          <button
            onClick={() => setActiveTab('customers')}
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            Manage Customers <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {recentCustomersList.map(c => (
            <div key={c.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
              <p className="text-xs font-extrabold text-slate-200 truncate">{c.name}</p>
              <p className="text-[11px] text-amber-400 font-mono">{c.phone}</p>
              <p className="text-[10px] text-slate-400 truncate">{c.address}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
