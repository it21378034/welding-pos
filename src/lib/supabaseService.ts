import { supabase } from './supabaseClient';
import type { Customer, CatalogItem, Quotation, Invoice, CompanySettings } from '../types';

// ── Helper: snake_case ↔ camelCase mappers ──────────────────

function customerToRow(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    email: c.email || null,
    notes: c.notes || null,
    created_at: c.createdAt,
  };
}

function rowToCustomer(r: any): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
    email: r.email ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

function catalogItemToRow(item: CatalogItem) {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    default_price: item.defaultPrice,
    description: item.description,
    category: item.category,
  };
}

function rowToCatalogItem(r: any): CatalogItem {
  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    defaultPrice: Number(r.default_price),
    description: r.description,
    category: r.category,
  };
}

function quotationToRow(q: Quotation) {
  return {
    id: q.id,
    quotation_number: q.quotationNumber,
    date: q.date,
    valid_until: q.validUntil,
    customer_id: q.customerId,
    customer_name: q.customerName,
    customer_phone: q.customerPhone,
    customer_address: q.customerAddress,
    customer_email: q.customerEmail || null,
    project_name: q.projectName,
    items: q.items,
    subtotal: q.subtotal,
    tax_rate: q.taxRate,
    tax_amount: q.taxAmount,
    discount: q.discount,
    grand_total: q.grandTotal,
    notes: q.notes,
    terms: q.terms,
    visibility: q.visibility,
    status: q.status,
    project_images: q.projectImages || [],
    drawing_url: q.drawingUrl || null,
    customer_signature: q.customerSignature || null,
    created_at: q.createdAt,
  };
}

function rowToQuotation(r: any): Quotation {
  return {
    id: r.id,
    quotationNumber: r.quotation_number,
    date: r.date,
    validUntil: r.valid_until,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerAddress: r.customer_address,
    customerEmail: r.customer_email ?? undefined,
    projectName: r.project_name,
    items: r.items || [],
    subtotal: Number(r.subtotal),
    taxRate: Number(r.tax_rate),
    taxAmount: Number(r.tax_amount),
    discount: Number(r.discount),
    grandTotal: Number(r.grand_total),
    notes: r.notes,
    terms: r.terms,
    visibility: r.visibility || { showPrices: true, showUnitPrice: true, showTotal: true },
    status: r.status,
    projectImages: r.project_images ?? undefined,
    drawingUrl: r.drawing_url ?? undefined,
    customerSignature: r.customer_signature ?? undefined,
    createdAt: r.created_at,
  };
}

function invoiceToRow(inv: Invoice) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    quotation_id: inv.quotationId || null,
    date: inv.date,
    due_date: inv.dueDate,
    customer_id: inv.customerId,
    customer_name: inv.customerName,
    customer_phone: inv.customerPhone,
    customer_address: inv.customerAddress,
    customer_email: inv.customerEmail || null,
    project_name: inv.projectName,
    items: inv.items,
    subtotal: inv.subtotal,
    tax_rate: inv.taxRate,
    tax_amount: inv.taxAmount,
    discount: inv.discount,
    grand_total: inv.grandTotal,
    paid_amount: inv.paidAmount,
    balance_due: inv.balanceDue,
    status: inv.status,
    payments: inv.payments,
    notes: inv.notes,
    terms: inv.terms,
    visibility: inv.visibility || null,
    created_at: inv.createdAt,
  };
}

function rowToInvoice(r: any): Invoice {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number,
    quotationId: r.quotation_id ?? undefined,
    date: r.date,
    dueDate: r.due_date,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerAddress: r.customer_address,
    customerEmail: r.customer_email ?? undefined,
    projectName: r.project_name,
    items: r.items || [],
    subtotal: Number(r.subtotal),
    taxRate: Number(r.tax_rate),
    taxAmount: Number(r.tax_amount),
    discount: Number(r.discount),
    grandTotal: Number(r.grand_total),
    paidAmount: Number(r.paid_amount),
    balanceDue: Number(r.balance_due),
    status: r.status,
    payments: r.payments || [],
    notes: r.notes,
    terms: r.terms,
    visibility: r.visibility ?? undefined,
    createdAt: r.created_at,
  };
}

function settingsToRow(s: CompanySettings) {
  return {
    id: 'default',
    name: s.name,
    tagline: s.tagline,
    address: s.address,
    phone1: s.phone1,
    phone2: s.phone2 || null,
    email: s.email,
    website: s.website || null,
    logo_url: s.logoUrl || null,
    currency: s.currency,
    tax_percentage: s.taxPercentage,
    quotation_prefix: s.quotationPrefix,
    invoice_prefix: s.invoicePrefix,
    default_quotation_terms: s.defaultQuotationTerms,
    default_invoice_terms: s.defaultInvoiceTerms,
    thermal_printer_width: s.thermalPrinterWidth,
    bank_details: s.bankDetails,
  };
}

function rowToSettings(r: any): CompanySettings {
  return {
    name: r.name,
    tagline: r.tagline,
    address: r.address,
    phone1: r.phone1,
    phone2: r.phone2 ?? undefined,
    email: r.email,
    website: r.website ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    currency: r.currency,
    taxPercentage: Number(r.tax_percentage),
    quotationPrefix: r.quotation_prefix,
    invoicePrefix: r.invoice_prefix,
    defaultQuotationTerms: r.default_quotation_terms,
    defaultInvoiceTerms: r.default_invoice_terms,
    thermalPrinterWidth: r.thermal_printer_width,
    bankDetails: r.bank_details,
  };
}

// ── Fetch All Data (init) ───────────────────────────────────

export interface SupabaseAppData {
  settings: CompanySettings | null;
  customers: Customer[];
  catalogItems: CatalogItem[];
  quotations: Quotation[];
  invoices: Invoice[];
}

export async function fetchAllData(): Promise<SupabaseAppData> {
  const [settingsRes, customersRes, catalogRes, quotationsRes, invoicesRes] = await Promise.all([
    supabase.from('company_settings').select('*').eq('id', 'default').maybeSingle(),
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('catalog_items').select('*'),
    supabase.from('quotations').select('*').order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').order('created_at', { ascending: false }),
  ]);

  // Throw on any fatal error
  for (const res of [settingsRes, customersRes, catalogRes, quotationsRes, invoicesRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  return {
    settings: settingsRes.data ? rowToSettings(settingsRes.data) : null,
    customers: (customersRes.data || []).map(rowToCustomer),
    catalogItems: (catalogRes.data || []).map(rowToCatalogItem),
    quotations: (quotationsRes.data || []).map(rowToQuotation),
    invoices: (invoicesRes.data || []).map(rowToInvoice),
  };
}

// ── Settings ────────────────────────────────────────────────

export async function upsertSettings(s: CompanySettings): Promise<void> {
  const { error } = await supabase
    .from('company_settings')
    .upsert(settingsToRow(s), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

// ── Customers ───────────────────────────────────────────────

export async function insertCustomer(c: Customer): Promise<void> {
  const { error } = await supabase.from('customers').insert(customerToRow(c));
  if (error) throw new Error(error.message);
}

export async function updateCustomerDb(id: string, updated: Partial<Customer>): Promise<void> {
  const row: any = {};
  if (updated.name !== undefined) row.name = updated.name;
  if (updated.phone !== undefined) row.phone = updated.phone;
  if (updated.address !== undefined) row.address = updated.address;
  if (updated.email !== undefined) row.email = updated.email || null;
  if (updated.notes !== undefined) row.notes = updated.notes || null;

  const { error } = await supabase.from('customers').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCustomerDb(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Catalog Items ───────────────────────────────────────────

export async function insertCatalogItem(item: CatalogItem): Promise<void> {
  const { error } = await supabase.from('catalog_items').insert(catalogItemToRow(item));
  if (error) throw new Error(error.message);
}

export async function updateCatalogItemDb(id: string, updated: Partial<CatalogItem>): Promise<void> {
  const row: any = {};
  if (updated.name !== undefined) row.name = updated.name;
  if (updated.unit !== undefined) row.unit = updated.unit;
  if (updated.defaultPrice !== undefined) row.default_price = updated.defaultPrice;
  if (updated.description !== undefined) row.description = updated.description;
  if (updated.category !== undefined) row.category = updated.category;

  const { error } = await supabase.from('catalog_items').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCatalogItemDb(id: string): Promise<void> {
  const { error } = await supabase.from('catalog_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Quotations ──────────────────────────────────────────────

export async function insertQuotation(q: Quotation): Promise<void> {
  const { error } = await supabase.from('quotations').insert(quotationToRow(q));
  if (error) throw new Error(error.message);
}

export async function updateQuotationDb(id: string, updated: Partial<Quotation>): Promise<void> {
  const row: any = {};
  if (updated.quotationNumber !== undefined) row.quotation_number = updated.quotationNumber;
  if (updated.date !== undefined) row.date = updated.date;
  if (updated.validUntil !== undefined) row.valid_until = updated.validUntil;
  if (updated.customerId !== undefined) row.customer_id = updated.customerId;
  if (updated.customerName !== undefined) row.customer_name = updated.customerName;
  if (updated.customerPhone !== undefined) row.customer_phone = updated.customerPhone;
  if (updated.customerAddress !== undefined) row.customer_address = updated.customerAddress;
  if (updated.customerEmail !== undefined) row.customer_email = updated.customerEmail || null;
  if (updated.projectName !== undefined) row.project_name = updated.projectName;
  if (updated.items !== undefined) row.items = updated.items;
  if (updated.subtotal !== undefined) row.subtotal = updated.subtotal;
  if (updated.taxRate !== undefined) row.tax_rate = updated.taxRate;
  if (updated.taxAmount !== undefined) row.tax_amount = updated.taxAmount;
  if (updated.discount !== undefined) row.discount = updated.discount;
  if (updated.grandTotal !== undefined) row.grand_total = updated.grandTotal;
  if (updated.notes !== undefined) row.notes = updated.notes;
  if (updated.terms !== undefined) row.terms = updated.terms;
  if (updated.visibility !== undefined) row.visibility = updated.visibility;
  if (updated.status !== undefined) row.status = updated.status;
  if (updated.projectImages !== undefined) row.project_images = updated.projectImages;
  if (updated.drawingUrl !== undefined) row.drawing_url = updated.drawingUrl;
  if (updated.customerSignature !== undefined) row.customer_signature = updated.customerSignature;

  const { error } = await supabase.from('quotations').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteQuotationDb(id: string): Promise<void> {
  const { error } = await supabase.from('quotations').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Invoices ────────────────────────────────────────────────

export async function insertInvoice(inv: Invoice): Promise<void> {
  const { error } = await supabase.from('invoices').insert(invoiceToRow(inv));
  if (error) throw new Error(error.message);
}

export async function updateInvoiceDb(id: string, updated: Partial<Invoice>): Promise<void> {
  const row: any = {};
  if (updated.invoiceNumber !== undefined) row.invoice_number = updated.invoiceNumber;
  if (updated.quotationId !== undefined) row.quotation_id = updated.quotationId;
  if (updated.date !== undefined) row.date = updated.date;
  if (updated.dueDate !== undefined) row.due_date = updated.dueDate;
  if (updated.customerId !== undefined) row.customer_id = updated.customerId;
  if (updated.customerName !== undefined) row.customer_name = updated.customerName;
  if (updated.customerPhone !== undefined) row.customer_phone = updated.customerPhone;
  if (updated.customerAddress !== undefined) row.customer_address = updated.customerAddress;
  if (updated.customerEmail !== undefined) row.customer_email = updated.customerEmail || null;
  if (updated.projectName !== undefined) row.project_name = updated.projectName;
  if (updated.items !== undefined) row.items = updated.items;
  if (updated.subtotal !== undefined) row.subtotal = updated.subtotal;
  if (updated.taxRate !== undefined) row.tax_rate = updated.taxRate;
  if (updated.taxAmount !== undefined) row.tax_amount = updated.taxAmount;
  if (updated.discount !== undefined) row.discount = updated.discount;
  if (updated.grandTotal !== undefined) row.grand_total = updated.grandTotal;
  if (updated.paidAmount !== undefined) row.paid_amount = updated.paidAmount;
  if (updated.balanceDue !== undefined) row.balance_due = updated.balanceDue;
  if (updated.status !== undefined) row.status = updated.status;
  if (updated.payments !== undefined) row.payments = updated.payments;
  if (updated.notes !== undefined) row.notes = updated.notes;
  if (updated.terms !== undefined) row.terms = updated.terms;
  if (updated.visibility !== undefined) row.visibility = updated.visibility;

  const { error } = await supabase.from('invoices').update(row).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteInvoiceDb(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Seed from localStorage (one-time migration) ────────────

export async function seedFromLocalStorage(data: {
  settings: CompanySettings;
  customers: Customer[];
  catalogItems: CatalogItem[];
  quotations: Quotation[];
  invoices: Invoice[];
}): Promise<void> {
  console.log('🌱 Seeding Supabase from localStorage...');

  // Settings
  await upsertSettings(data.settings);

  // Customers
  if (data.customers.length > 0) {
    const { error } = await supabase
      .from('customers')
      .upsert(data.customers.map(customerToRow), { onConflict: 'id' });
    if (error) console.error('Seed customers error:', error.message);
  }

  // Catalog Items
  if (data.catalogItems.length > 0) {
    const { error } = await supabase
      .from('catalog_items')
      .upsert(data.catalogItems.map(catalogItemToRow), { onConflict: 'id' });
    if (error) console.error('Seed catalog error:', error.message);
  }

  // Quotations
  if (data.quotations.length > 0) {
    const { error } = await supabase
      .from('quotations')
      .upsert(data.quotations.map(quotationToRow), { onConflict: 'id' });
    if (error) console.error('Seed quotations error:', error.message);
  }

  // Invoices
  if (data.invoices.length > 0) {
    const { error } = await supabase
      .from('invoices')
      .upsert(data.invoices.map(invoiceToRow), { onConflict: 'id' });
    if (error) console.error('Seed invoices error:', error.message);
  }

  console.log('✅ Seeding complete!');
}
