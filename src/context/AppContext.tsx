import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, CatalogItem, Quotation, Invoice, CompanySettings, Role, Language, PurchaseList } from '../types';
import { initialSettings, initialCustomers, initialCatalogItems, initialQuotations, initialInvoices } from '../data/initialData';
import { translations } from '../locales/i18n';
import * as db from '../lib/supabaseService';

interface AppContextType {
  // Navigation & Theme
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  role: Role;
  setRole: (role: Role) => void;

  // Cloud sync state
  isLoading: boolean;
  isOnline: boolean;
  syncError: string | null;
  clearSyncError: () => void;

  // Data collections
  settings: CompanySettings;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  catalogItems: CatalogItem[];
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => void;
  updateCatalogItem: (id: string, item: Partial<CatalogItem>) => void;
  deleteCatalogItem: (id: string) => void;

  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>) => Quotation;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  duplicateQuotation: (id: string) => Quotation;
  convertQuotationToInvoice: (quotationId: string) => Invoice;

  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  recordPayment: (invoiceId: string, payment: { amount: number; method: 'cash' | 'card' | 'bank_transfer' | 'cheque'; note?: string }) => void;

  purchaseLists: PurchaseList[];
  addPurchaseList: (pl: Omit<PurchaseList, 'id' | 'listNumber' | 'createdAt'>) => PurchaseList;
  updatePurchaseList: (id: string, pl: Partial<PurchaseList>) => void;
  deletePurchaseList: (id: string) => void;
  duplicatePurchaseList: (id: string) => PurchaseList;

  // Active Print Target
  activePrintDocument: { type: 'quotation' | 'invoice'; data: Quotation | Invoice; layout: 'a4' | 'thermal' } | null;
  setActivePrintDocument: (doc: { type: 'quotation' | 'invoice'; data: Quotation | Invoice; layout: 'a4' | 'thermal' } | null) => void;

  // Backup & Restore
  exportDatabase: () => void;
  importDatabase: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'welding_pos_data_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [role, setRole] = useState<Role>('admin');

  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(initialCatalogItems);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [purchaseLists, setPurchaseLists] = useState<PurchaseList[]>([]);

  const [activePrintDocument, setActivePrintDocument] = useState<{ type: 'quotation' | 'invoice'; data: Quotation | Invoice; layout: 'a4' | 'thermal' } | null>(null);

  // Cloud sync state
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  // Fire-and-forget Supabase write with error handling
  const syncToCloud = useCallback((operation: () => Promise<void>, label: string) => {
    operation().catch((err) => {
      console.error(`☁️ Sync failed [${label}]:`, err.message);
      setSyncError(`Sync failed: ${label}`);
      setIsOnline(false);
      // Auto-clear error after 6 seconds
      setTimeout(() => setSyncError(null), 6000);
    });
  }, []);

  // ── Init: Load from Supabase, fallback to localStorage ────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      // First, load any locally-cached theme/language prefs
      try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.theme) setTheme(parsed.theme);
          if (parsed.language) setLanguage(parsed.language);
        }
      } catch (e) {
        console.error('Failed to read localStorage prefs:', e);
      }

      // Attempt to fetch from Supabase
      try {
        const cloudData = await db.fetchAllData();
        if (cancelled) return;

        const hasCloudData =
          cloudData.customers.length > 0 ||
          cloudData.quotations.length > 0 ||
          cloudData.invoices.length > 0 ||
          cloudData.catalogItems.length > 0 ||
          cloudData.purchaseLists.length > 0 ||
          cloudData.settings !== null;

        if (hasCloudData) {
          // Cloud has data → use it
          if (cloudData.settings) setSettings(cloudData.settings);
          setCustomers(cloudData.customers);
          setCatalogItems(cloudData.catalogItems);
          setQuotations(cloudData.quotations);
          setInvoices(cloudData.invoices);
          setPurchaseLists(cloudData.purchaseLists);
          setIsOnline(true);
        } else {
          // Cloud is empty → try seeding from localStorage
          try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedData) {
              const parsed = JSON.parse(savedData);
              const localSettings = parsed.settings ? { ...initialSettings, ...parsed.settings } : initialSettings;
              const localCustomers = parsed.customers || initialCustomers;
              const localCatalog = parsed.catalogItems || initialCatalogItems;
              const localQuotations = parsed.quotations || initialQuotations;
              const localInvoices = parsed.invoices || initialInvoices;

              setSettings(localSettings);
              setCustomers(localCustomers);
              setCatalogItems(localCatalog);
              setQuotations(localQuotations);
              setInvoices(localInvoices);

              // Seed to Supabase
              await db.seedFromLocalStorage({
                settings: localSettings,
                customers: localCustomers,
                catalogItems: localCatalog,
                quotations: localQuotations,
                invoices: localInvoices,
                purchaseLists: parsed.purchaseLists || [],
              });
              setIsOnline(true);
            } else {
              // No localStorage data either → seed defaults to Supabase
              await db.seedFromLocalStorage({
                settings: initialSettings,
                customers: initialCustomers,
                catalogItems: initialCatalogItems,
                quotations: initialQuotations,
                invoices: initialInvoices,
                purchaseLists: [],
              });
              setIsOnline(true);
            }
          } catch (seedErr) {
            console.error('Seed failed:', seedErr);
            setIsOnline(false);
          }
        }
      } catch (fetchErr) {
        console.error('☁️ Supabase fetch failed, using localStorage fallback:', fetchErr);
        setIsOnline(false);

        // Fallback to localStorage
        try {
          const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.settings) setSettings({ ...initialSettings, ...parsed.settings });
            if (parsed.customers) setCustomers(parsed.customers);
            if (parsed.catalogItems) setCatalogItems(parsed.catalogItems);
            if (parsed.quotations) setQuotations(parsed.quotations);
            if (parsed.invoices) setInvoices(parsed.invoices);
          }
        } catch (e) {
          console.error('Failed to parse local storage fallback:', e);
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // ── Save to localStorage cache when state changes ─────────
  useEffect(() => {
    if (isLoading) return; // Don't cache during initial load
    try {
      const stateToSave = {
        settings,
        customers,
        catalogItems,
        quotations,
        invoices,
        theme,
        language,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to local storage:', e);
    }
  }, [settings, customers, catalogItems, quotations, invoices, theme, language, isLoading]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // Helper for generating serial numbers
  const generateQuotationNumber = () => {
    const nextNum = quotations.length + 1;
    return `${settings.quotationPrefix}${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
  };

  const generateInvoiceNumber = () => {
    const nextNum = invoices.length + 1;
    return `${settings.invoicePrefix}${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
  };

  // ── CRUD Actions (write-through to Supabase) ─────────────

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      syncToCloud(() => db.upsertSettings(merged), 'updateSettings');
      return merged;
    });
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: 'cust-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    syncToCloud(() => db.insertCustomer(newCust), 'addCustomer');
    return newCust;
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
    syncToCloud(() => db.updateCustomerDb(id, updated), 'updateCustomer');
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    syncToCloud(() => db.deleteCustomerDb(id), 'deleteCustomer');
  };

  const addCatalogItem = (itemData: Omit<CatalogItem, 'id'>) => {
    const newItem: CatalogItem = {
      ...itemData,
      id: 'item-' + Date.now(),
    };
    setCatalogItems(prev => [newItem, ...prev]);
    syncToCloud(() => db.insertCatalogItem(newItem), 'addCatalogItem');
  };

  const updateCatalogItem = (id: string, updated: Partial<CatalogItem>) => {
    setCatalogItems(prev => prev.map(i => (i.id === id ? { ...i, ...updated } : i)));
    syncToCloud(() => db.updateCatalogItemDb(id, updated), 'updateCatalogItem');
  };

  const deleteCatalogItem = (id: string) => {
    setCatalogItems(prev => prev.filter(i => i.id !== id));
    syncToCloud(() => db.deleteCatalogItemDb(id), 'deleteCatalogItem');
  };

  const addQuotation = (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt'>): Quotation => {
    const newQuotation: Quotation = {
      ...quotationData,
      id: 'qt-' + Date.now(),
      quotationNumber: generateQuotationNumber(),
      createdAt: new Date().toISOString(),
    };
    setQuotations(prev => [newQuotation, ...prev]);
    syncToCloud(() => db.insertQuotation(newQuotation), 'addQuotation');
    return newQuotation;
  };

  const updateQuotation = (id: string, updated: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, ...updated } : q)));
    syncToCloud(() => db.updateQuotationDb(id, updated), 'updateQuotation');
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    syncToCloud(() => db.deleteQuotationDb(id), 'deleteQuotation');
  };

  const duplicateQuotation = (id: string): Quotation => {
    const original = quotations.find(q => q.id === id);
    if (!original) throw new Error('Quotation not found');

    const duplicated: Quotation = {
      ...original,
      id: 'qt-' + Date.now(),
      quotationNumber: generateQuotationNumber(),
      projectName: `${original.projectName} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    setQuotations(prev => [duplicated, ...prev]);
    syncToCloud(() => db.insertQuotation(duplicated), 'duplicateQuotation');
    return duplicated;
  };

  const convertQuotationToInvoice = (quotationId: string): Invoice => {
    const q = quotations.find(item => item.id === quotationId);
    if (!q) throw new Error('Quotation not found');

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      quotationId: q.id,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      customerId: q.customerId,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      customerAddress: q.customerAddress,
      customerEmail: q.customerEmail,
      projectName: q.projectName,
      items: q.items,
      subtotal: q.subtotal,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      discount: q.discount,
      grandTotal: q.grandTotal,
      paidAmount: 0,
      balanceDue: q.grandTotal,
      status: 'pending',
      payments: [],
      notes: q.notes,
      terms: settings.defaultInvoiceTerms,
      visibility: q.visibility,
      projectImages: q.projectImages,
      createdAt: new Date().toISOString(),
    };

    // Mark quotation as converted
    updateQuotation(q.id, { status: 'converted' });

    setInvoices(prev => [newInvoice, ...prev]);
    syncToCloud(() => db.insertInvoice(newInvoice), 'convertToInvoice');
    return newInvoice;
  };

  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'inv-' + Date.now(),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date().toISOString(),
    };
    setInvoices(prev => [newInvoice, ...prev]);
    syncToCloud(() => db.insertInvoice(newInvoice), 'addInvoice');
    return newInvoice;
  };

  const updateInvoice = (id: string, updated: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, ...updated } : inv)));
    syncToCloud(() => db.updateInvoiceDb(id, updated), 'updateInvoice');
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    syncToCloud(() => db.deleteInvoiceDb(id), 'deleteInvoice');
  };

  const recordPayment = (invoiceId: string, payment: { amount: number; method: 'cash' | 'card' | 'bank_transfer' | 'cheque'; note?: string }) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== invoiceId) return inv;

        const newPayment = {
          id: 'pay-' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          amount: payment.amount,
          method: payment.method,
          note: payment.note,
        };

        const updatedPaid = inv.paidAmount + payment.amount;
        const updatedBalance = Math.max(0, inv.grandTotal - updatedPaid);
        const updatedStatus = updatedBalance === 0 ? 'paid' : updatedPaid > 0 ? 'partially_paid' : 'pending';

        const updatedInv = {
          ...inv,
          paidAmount: updatedPaid,
          balanceDue: updatedBalance,
          status: updatedStatus as 'pending' | 'partially_paid' | 'paid',
          payments: [...inv.payments, newPayment],
        };

        // Sync the full updated invoice to Supabase
        syncToCloud(
          () => db.updateInvoiceDb(invoiceId, {
            paidAmount: updatedPaid,
            balanceDue: updatedBalance,
            status: updatedStatus as 'pending' | 'partially_paid' | 'paid',
            payments: updatedInv.payments,
          }),
          'recordPayment'
        );

        return updatedInv;
      })
    );
  };

  const addPurchaseList = (plData: Omit<PurchaseList, 'id' | 'listNumber' | 'createdAt'>): PurchaseList => {
    const newList: PurchaseList = {
      ...plData,
      id: 'pl-' + Date.now(),
      listNumber: `PL-${new Date().getFullYear()}-${String(purchaseLists.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };
    setPurchaseLists(prev => [newList, ...prev]);
    syncToCloud(() => db.upsertPurchaseList(newList), 'addPurchaseList');
    return newList;
  };

  const updatePurchaseList = (id: string, updated: Partial<PurchaseList>) => {
    setPurchaseLists(prev => {
      const newList = prev.map(pl => pl.id === id ? { ...pl, ...updated } : pl);
      const changed = newList.find(pl => pl.id === id);
      if (changed) syncToCloud(() => db.upsertPurchaseList(changed), 'updatePurchaseList');
      return newList;
    });
  };

  const deletePurchaseList = (id: string) => {
    setPurchaseLists(prev => prev.filter(pl => pl.id !== id));
    syncToCloud(() => db.deletePurchaseList(id), 'deletePurchaseList');
  };

  const duplicatePurchaseList = (id: string): PurchaseList => {
    const listToDup = purchaseLists.find(pl => pl.id === id);
    if (!listToDup) throw new Error('List not found');
    const newList: PurchaseList = {
      ...listToDup,
      id: 'pl-' + Date.now(),
      listNumber: `PL-${new Date().getFullYear()}-${String(purchaseLists.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    setPurchaseLists(prev => [newList, ...prev]);
    syncToCloud(() => db.upsertPurchaseList(newList), 'duplicatePurchaseList');
    return newList;
  };

  const exportDatabase = () => {
    const exportData = {
      settings,
      customers,
      catalogItems,
      quotations,
      invoices,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Welding_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabase = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.customers && parsed.quotations && parsed.invoices) {
        const importedSettings = parsed.settings || settings;
        const importedCustomers = parsed.customers;
        const importedCatalog = parsed.catalogItems || catalogItems;
        const importedQuotations = parsed.quotations;
        const importedInvoices = parsed.invoices;

        if (parsed.settings) setSettings(importedSettings);
        setCustomers(importedCustomers);
        if (parsed.catalogItems) setCatalogItems(importedCatalog);
        setQuotations(importedQuotations);
        setInvoices(importedInvoices);

        // Sync imported data to Supabase
        syncToCloud(
          () => db.seedFromLocalStorage({
            settings: importedSettings,
            customers: importedCustomers,
            catalogItems: importedCatalog,
            quotations: importedQuotations,
            invoices: importedInvoices,
          }),
          'importDatabase'
        );

        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        role,
        setRole,

        isLoading,
        isOnline,
        syncError,
        clearSyncError,

        settings,
        updateSettings,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        catalogItems,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,

        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        duplicateQuotation,
        convertQuotationToInvoice,

        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        purchaseLists,
        addPurchaseList,
        updatePurchaseList,
        deletePurchaseList,
        duplicatePurchaseList,
        recordPayment,

        activePrintDocument,
        setActivePrintDocument,

        exportDatabase,
        importDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
