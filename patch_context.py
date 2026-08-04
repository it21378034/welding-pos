import sys

with open('src/context/AppContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PurchaseList to imports
content = content.replace("import type { Customer, CatalogItem, Quotation, Invoice, CompanySettings, Role, Language } from '../types';",
                          "import type { Customer, CatalogItem, Quotation, Invoice, CompanySettings, Role, Language, PurchaseList } from '../types';")

# 2. Add purchaseLists to AppContextType
context_type_old = '''  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  recordPayment: (invoiceId: string, payment: { amount: number; method: 'cash' | 'card' | 'bank_transfer' | 'cheque'; note?: string }) => void;'''
context_type_new = context_type_old + '''

  purchaseLists: PurchaseList[];
  addPurchaseList: (pl: Omit<PurchaseList, 'id' | 'listNumber' | 'createdAt'>) => PurchaseList;
  updatePurchaseList: (id: string, pl: Partial<PurchaseList>) => void;
  deletePurchaseList: (id: string) => void;
  duplicatePurchaseList: (id: string) => PurchaseList;'''

content = content.replace(context_type_old, context_type_new)

# 3. Add to state
state_old = "const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);"
state_new = state_old + "\n  const [purchaseLists, setPurchaseLists] = useState<PurchaseList[]>([]);"
content = content.replace(state_old, state_new)

# 4. Add loadData
load_data_old = '''        const [customersData, catalogData, quotationsData, invoicesData, settingsData] = await Promise.all([
          db.fetchCustomers(),
          db.fetchCatalogItems(),
          db.fetchQuotations(),
          db.fetchInvoices(),
          db.fetchSettings()
        ]);'''
load_data_new = '''        const [customersData, catalogData, quotationsData, invoicesData, settingsData, purchaseListsData] = await Promise.all([
          db.fetchCustomers(),
          db.fetchCatalogItems(),
          db.fetchQuotations(),
          db.fetchInvoices(),
          db.fetchSettings(),
          db.fetchPurchaseLists()
        ]);'''
content = content.replace(load_data_old, load_data_new)

set_data_old = '''        setInvoices(invoicesData);
        setSettings(settingsData);'''
set_data_new = '''        setInvoices(invoicesData);
        setSettings(settingsData);
        setPurchaseLists(purchaseListsData);'''
content = content.replace(set_data_old, set_data_new)

local_fallback_old = "const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');"
local_fallback_new = local_fallback_old + "\n        const localPurchaseLists = JSON.parse(localStorage.getItem('purchaseLists') || '[]');"
content = content.replace(local_fallback_old, local_fallback_new)

set_local_old = '''        setInvoices(localInvoices.length ? localInvoices : initialInvoices);'''
set_local_new = '''        setInvoices(localInvoices.length ? localInvoices : initialInvoices);
        setPurchaseLists(localPurchaseLists);'''
content = content.replace(set_local_old, set_local_new)

# 5. Add localStorage persist for purchaseLists
effect_old = '''  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);'''
effect_new = effect_old + '''\n  useEffect(() => {
    localStorage.setItem('purchaseLists', JSON.stringify(purchaseLists));
  }, [purchaseLists]);'''
content = content.replace(effect_old, effect_new)

# 6. Add CRUD functions
functions_old = '''  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    syncToCloud(() => db.deleteInvoice(id), 'Delete Invoice');
  }, [syncToCloud]);'''

functions_new = functions_old + '''\n
  // ── Purchase Lists ──────────────────────────────────────────────────
  const addPurchaseList = useCallback((plData: Omit<PurchaseList, 'id' | 'listNumber' | 'createdAt'>) => {
    const newList: PurchaseList = {
      ...plData,
      id: 'pl-' + Date.now(),
      listNumber: `PL-${new Date().getFullYear()}-${String(purchaseLists.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };
    setPurchaseLists(prev => [newList, ...prev]);
    syncToCloud(() => db.upsertPurchaseList(newList), 'Add Purchase List');
    return newList;
  }, [purchaseLists.length, syncToCloud]);

  const updatePurchaseList = useCallback((id: string, updated: Partial<PurchaseList>) => {
    setPurchaseLists(prev => {
      const newList = prev.map(pl => pl.id === id ? { ...pl, ...updated } : pl);
      const changed = newList.find(pl => pl.id === id);
      if (changed) syncToCloud(() => db.upsertPurchaseList(changed), 'Update Purchase List');
      return newList;
    });
  }, [syncToCloud]);

  const deletePurchaseList = useCallback((id: string) => {
    setPurchaseLists(prev => prev.filter(pl => pl.id !== id));
    syncToCloud(() => db.deletePurchaseList(id), 'Delete Purchase List');
  }, [syncToCloud]);

  const duplicatePurchaseList = useCallback((id: string) => {
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
    syncToCloud(() => db.upsertPurchaseList(newList), 'Duplicate Purchase List');
    return newList;
  }, [purchaseLists, syncToCloud]);
'''
content = content.replace(functions_old, functions_new)

# 7. Provide context values
provide_old = "deleteInvoice,"
provide_new = provide_old + "\n        purchaseLists,\n        addPurchaseList,\n        updatePurchaseList,\n        deletePurchaseList,\n        duplicatePurchaseList,"
content = content.replace(provide_old, provide_new)

# 8. Export/Import DB handling
export_old = "const data = {\n      settings,\n      customers,\n      catalogItems,\n      quotations,\n      invoices\n    };"
export_new = "const data = {\n      settings,\n      customers,\n      catalogItems,\n      quotations,\n      invoices,\n      purchaseLists\n    };"
content = content.replace(export_old, export_new)

import_old = "setInvoices(parsed.invoices || []);"
import_new = import_old + "\n        setPurchaseLists(parsed.purchaseLists || []);"
content = content.replace(import_old, import_new)

with open('src/context/AppContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
