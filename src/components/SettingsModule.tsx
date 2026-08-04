import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Save, Download, Upload, Building, ShieldCheck, Printer } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings, exportDatabase, importDatabase, t } = useApp();
  const [formData, setFormData] = useState(settings);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    alert('Settings saved successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importDatabase(content);
      if (success) {
        setImportStatus('Database restored successfully!');
      } else {
        setImportStatus('Error: Invalid database JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          {t('companySettings')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure workshop header info, logo, currency, invoice prefixes & thermal printer settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Profile */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            Company & Workshop Profile
          </h3>

          {/* Logo preview and upload */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <img 
              src={formData.logoUrl || '/logo.png'} 
              alt="Workshop Logo" 
              className="w-16 h-16 object-contain rounded-full bg-slate-900 border border-amber-500/40 p-1 shrink-0 shadow-md"
            />
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase">Company Logo</label>
              <p className="text-[11px] text-slate-400">Used on normal A4 prints, thermal POS receipts, and navigation headers.</p>
              <div className="flex items-center gap-2 pt-1">
                <label className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer transition shadow">
                  Upload Logo Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setFormData({ ...formData, logoUrl: evt.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
                {formData.logoUrl && formData.logoUrl !== '/logo.png' && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: '/logo.png' })}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition"
                  >
                    Reset to Default
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('companyName')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('tagline')}</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('address')}</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('phone1')}</label>
              <input
                type="text"
                required
                value={formData.phone1}
                onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('phone2')}</label>
              <input
                type="text"
                value={formData.phone2 || ''}
                onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Invoice / Quotation Format & Thermal Printer */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            Document Prefixes & Thermal Printer Setup
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('quotationPrefix')}</label>
              <input
                type="text"
                value={formData.quotationPrefix}
                onChange={e => setFormData({ ...formData, quotationPrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('invoicePrefix')}</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('currencySymbol')}</label>
              <input
                type="text"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('thermalPrinterWidth')}</label>
              <select
                value={formData.thermalPrinterWidth}
                onChange={e => setFormData({ ...formData, thermalPrinterWidth: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="80mm">80mm Standard POS Printer</option>
                <option value="58mm">58mm Compact POS Printer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">{t('bankDetails')}</label>
            <textarea
              rows={2}
              value={formData.bankDetails}
              onChange={e => setFormData({ ...formData, bankDetails: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Database Backup & Restore */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Database Backup & Restore
          </h3>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={exportDatabase}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold flex items-center gap-2 border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{t('backupDatabase')}</span>
            </button>

            <label className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold flex items-center gap-2 border border-slate-700 cursor-pointer transition">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>{t('restoreDatabase')}</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <p className="text-xs font-semibold text-amber-400 pt-1">{importStatus}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{t('save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
