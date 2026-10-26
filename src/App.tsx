import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, Navbar } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CustomerModule } from './components/CustomerModule';
import { CatalogModule } from './components/CatalogModule';
import { QuotationModule } from './components/QuotationModule';
import { InvoiceModule } from './components/InvoiceModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { PrintView } from './components/PrintView';
import { PurchaseListModule } from './components/PurchaseListModule';
import { StickerModule } from './components/StickerModule';
import { LoginScreen } from './components/LoginScreen';
import { ToastProvider } from './components/Toast';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin" />
      <Loader2 className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
    </div>
    <div className="text-center">
      <p className="text-slate-200 font-bold text-sm">Loading Workshop Data</p>
      <p className="text-slate-500 text-xs mt-1">Connecting to Supabase cloud...</p>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { activeTab, theme, isLoading, currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) return <LoadingScreen />;

  // Require authentication to access the system
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} antialiased selection:bg-amber-500 selection:text-slate-950`}>
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 w-full max-w-full print:hidden">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'quotations' && <QuotationModule />}
          {activeTab === 'invoices' && <InvoiceModule />}
          {activeTab === 'customers' && <CustomerModule />}
          {activeTab === 'catalog' && <CatalogModule />}
          {activeTab === 'purchase-lists' && <PurchaseListModule />}
          {activeTab === 'stickers' && <StickerModule />}
          {activeTab === 'reports' && <ReportsModule />}
          {activeTab === 'settings' && <SettingsModule />}
        </main>
      </div>

      <PrintView />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
