import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Award, 
  FileSpreadsheet, 
} from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const { invoices, settings, t } = useApp();

  // Metrics
  const totalSales = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalReceived = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalPending = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

  // Export CSV
  const exportInvoicesCSV = () => {
    const headers = ['Invoice No,Customer,Date,Total,Paid,Balance,Status\n'];
    const rows = invoices.map(
      i => `"${i.invoiceNumber}","${i.customerName}","${i.date}",${i.grandTotal},${i.paidAmount},${i.balanceDue},"${i.status}"`
    );
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Welding_Invoices_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            {t('reports')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Financial breakdown, income reports & pending customer balances export.
          </p>
        </div>

        <button
          onClick={exportInvoicesCSV}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Billed Revenue</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-slate-100">
            {settings.currency} {totalSales.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Cash Received</span>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {settings.currency} {totalReceived.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Pending Balances</span>
            <Clock className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-rose-400">
            {settings.currency} {totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pending Payments Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-rose-400" />
          Pending Customer Balances
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[900px]">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices
                .filter(i => i.balanceDue > 0)
                .map(inv => (
                  <tr key={inv.id}>
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{inv.customerName}</td>
                    <td className="py-3 px-4 font-mono text-amber-400">{inv.customerPhone}</td>
                    <td className="py-3 px-4 font-mono">
                      {settings.currency} {inv.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {settings.currency} {inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-rose-400 text-right">
                      {settings.currency} {inv.balanceDue.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
