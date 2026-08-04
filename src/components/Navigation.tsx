import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  FileText, 
  Receipt, 
  BarChart3, 
  Settings as SettingsIcon, 
  Globe, 
  Moon, 
  Sun,
  Menu,
  X,
  ShoppingCart
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, t, settings, isOnline, syncError } = useApp();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'quotations', label: t('quotations'), icon: FileText },
    { id: 'invoices', label: t('invoices'), icon: Receipt },
    { id: 'customers', label: t('customers'), icon: Users },
    { id: 'catalog', label: t('catalog'), icon: Wrench },
    { id: 'purchase-lists', label: 'Purchase Lists', icon: ShoppingCart },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'settings', label: t('settings'), icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col justify-between shrink-0 select-none print:hidden transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={settings.logoUrl || '/logo.png'} 
                alt="Logo" 
                className="w-9 h-9 object-contain rounded-full bg-slate-800 border border-slate-700/80 p-0.5 shrink-0" 
              />
              <div className="min-w-0">
                <h1 className="font-black text-slate-100 text-sm leading-tight tracking-wide truncate">
                  VASANTHA <span className="text-amber-400">IRON WORKS</span>
                </h1>
                <p className="text-[9px] text-amber-400/90 font-medium tracking-wider uppercase truncate">
                  Welding & POS System
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cloud Sync Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className={`p-3 rounded-lg border flex items-center gap-3 ${
            syncError
              ? 'bg-amber-500/10 border-amber-500/30'
              : isOnline
                ? 'bg-slate-800/40 border-slate-700/50'
                : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              syncError
                ? 'bg-amber-400 animate-pulse'
                : isOnline
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-red-400'
            }`} />
            <div className="overflow-hidden">
              <p className={`text-xs font-semibold truncate ${
                syncError ? 'text-amber-300' : isOnline ? 'text-slate-200' : 'text-red-300'
              }`}>
                {syncError ? 'Sync Warning' : isOnline ? 'Cloud Connected' : 'Offline Mode'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {syncError || (isOnline ? 'Supabase Synced' : 'Using local cache')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Navbar: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const { theme, toggleTheme, language, setLanguage, role, setRole, settings } = useApp();

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-slate-200 shrink-0 print:hidden">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img 
            src={settings.logoUrl || '/logo.png'} 
            alt="Logo" 
            className="w-7 h-7 object-contain rounded-full bg-slate-800 border border-slate-700 p-0.5" 
          />
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 truncate max-w-[180px] sm:max-w-none">
            {settings.name}
          </h2>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          POS v1.0
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher */}
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700/60 text-xs">
          <button
            onClick={() => setRole('admin')}
            className={`px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
              role === 'admin' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('staff')}
            className={`px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all ${
              role === 'staff' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700/60 transition"
          title="Switch Language / භාෂාව මාරු කරන්න"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xs:inline">{language === 'en' ? 'EN' : 'සිං'}</span>
          <span className="inline xs:hidden">{language === 'en' ? 'EN' : 'SI'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/60 transition"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-200" />}
        </button>
      </div>
    </header>
  );
};
