import React, { useState } from 'react';
import { useToast } from './Toast';
import { useApp } from '../context/AppContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  Download, 
  Upload, 
  Building, 
  ShieldCheck, 
  Printer, 
  Sparkles, 
  ExternalLink,
  Users as UsersIcon,
  UserPlus,
  Trash2,
  Shield,
  Check,
  AlertCircle,
  X,
  Edit2,
  QrCode,
  Globe
} from 'lucide-react';
import { saveGeminiApiKey } from '../lib/geminiVisionService';
import type { Role } from '../types';

export const SettingsModule: React.FC = () => {
  const { showToast, showConfirm } = useToast();
  const { 
    settings, 
    updateSettings, 
    exportDatabase, 
    importDatabase, 
    setActiveTab,
    t,
    users,
    addUser,
    updateUser,
    deleteUser
  } = useApp();
  const [formData, setFormData] = useState(settings);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // User Access Management State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('welding@123');
  const [newUserRole, setNewUserRole] = useState<Role>('staff');
  const [userMsg, setUserMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('staff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.geminiApiKey !== undefined) {
      saveGeminiApiKey(formData.geminiApiKey);
    }
    updateSettings(formData);
    showToast('Settings saved successfully!', 'success');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    const res = addUser({
      email: newUserEmail,
      name: newUserName,
      password: newUserPassword,
      role: newUserRole,
    });
    if (res.success) {
      setUserMsg({ text: `Access granted successfully to ${newUserEmail}!`, isError: false });
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('welding@123');
      setNewUserRole('staff');
      setShowAddUserModal(false);
    } else {
      setUserMsg({ text: res.error || 'Failed to add user.', isError: true });
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    const confirmed = await showConfirm({
      title: 'Revoke User Access',
      message: `Are you sure you want to revoke access for ${email}?`,
      confirmLabel: 'Revoke Access',
      danger: true,
    });
    if (confirmed) {
      setUserMsg(null);
      const res = deleteUser(id);
      if (res.success) {
        showToast(`Access revoked for ${email}.`, 'success');
      } else {
        showToast(res.error || 'Failed to revoke access.', 'error');
      }
    }
  };

  const handleSaveEditUser = (userId: string) => {
    setUserMsg(null);
    const updates: any = { role: editRole };
    if (editPassword && editPassword.trim()) {
      updates.password = editPassword.trim();
    }
    const res = updateUser(userId, updates);
    if (res.success) {
      setUserMsg({ text: 'User details updated successfully!', isError: false });
      setEditingUserId(null);
      setEditPassword('');
    } else {
      setUserMsg({ text: res.error || 'Failed to update user.', isError: true });
    }
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

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Company Website (Used for QR Codes)</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={formData.website || ''}
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.vasanthaironworks.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Make Sticker Quick Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Workshop Branded Stickers (15 cm × 3 cm)</p>
                <p className="text-xs text-slate-400">
                  Generate metal product badges & stickers with your logo, contact numbers, and website QR code.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('stickers')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>Open Make Sticker</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
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

        {/* AI Vision & Note Scanner Settings */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            AI Vision Note & Bill Scanner (Google Gemini)
          </h3>
          <p className="text-xs text-slate-400">
            Allows you to upload or photograph handwritten workshop material lists, hardware store bills, and notebooks to automatically generate itemized Quotations.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Google Gemini API Key
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={formData.geminiApiKey || ''}
                onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="AIzaSy... (Paste your Google AI Studio key)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Google AI Studio gives you a generous free tier for vision OCR. No credit card required.
            </p>
          </div>
        </div>

        {/* Team & User Access Control */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-amber-400" />
                Team & System Access Control
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Grant or revoke workshop POS login access for other users manually by email.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddUserModal(true);
                setUserMsg(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Authorized User</span>
            </button>
          </div>

          {userMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-medium ${
              userMsg.isError ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            }`}>
              {userMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /> : <Check className="w-4 h-4 shrink-0 text-emerald-400" />}
              <span>{userMsg.text}</span>
            </div>
          )}

          {/* Add User Modal / Inline Form */}
          {showAddUserModal && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Grant New User Access
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    User Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    placeholder="staff@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="e.g. Kasun Fernando"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Assign Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    User Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="staff">Staff (Billing & Quotes)</option>
                    <option value="admin">Admin (Full System Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow transition cursor-pointer"
                >
                  Grant System Access
                </button>
              </div>
            </div>
          )}

          {/* Authorized Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">User & Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Added Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {users.map(u => {
                  const isEditing = editingUserId === u.id;
                  const isSuper = u.isSuperAdmin || u.email.toLowerCase() === 'deshithanayanajith@gmail.com';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name ? u.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-100">{u.name}</span>
                            <span className="block text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select
                            value={editRole}
                            disabled={isSuper}
                            onChange={e => setEditRole(e.target.value as Role)}
                            className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-100"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Shield className="w-3 h-3 text-amber-400" />
                            Primary Owner
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Authorized
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Initial'}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="text"
                              value={editPassword}
                              onChange={e => setEditPassword(e.target.value)}
                              placeholder="New password"
                              className="px-2 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-mono w-28"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditUser(u.id)}
                              className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingUserId(null)}
                              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditRole(u.role);
                                setEditPassword('');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                              title="Edit user role or password"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Revoke access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
