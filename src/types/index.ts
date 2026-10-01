export type Role = 'admin' | 'staff';

export type Language = 'en' | 'si';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  unit: string; // e.g. Sq Ft, Feet, Meters, Nos, Hours, Job
  defaultPrice: number;
  description: string;
  category: 'material' | 'labor' | 'service' | 'other';
}

export interface LineItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
}

export interface PriceVisibilityOptions {
  showPrices: boolean;      // Master toggle for prices
  showUnitPrice: boolean;   // Toggle unit price column
  showTotal: boolean;       // Toggle grand total & line totals
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g., QT-2026-001
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  projectName: string;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  notes: string;
  terms: string;
  visibility: PriceVisibilityOptions;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  projectImages?: string[]; // base64 strings or URLs
  drawingUrl?: string;
  customerSignature?: string; // base64 canvas image
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., INV-2026-001
  quotationId?: string; // linked quotation if converted
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  projectName: string;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'pending' | 'partially_paid' | 'paid';
  payments: InvoicePayment[];
  notes: string;
  terms: string;
  visibility?: PriceVisibilityOptions;
  projectImages?: string[];
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  phone1: string;
  phone2?: string;
  email: string;
  website?: string;
  logoUrl?: string;
  currency: string;
  taxPercentage: number;
  quotationPrefix: string;
  invoicePrefix: string;
  defaultQuotationTerms: string;
  defaultInvoiceTerms: string;
  thermalPrinterWidth: '58mm' | '80mm';
  bankDetails: string;
  geminiApiKey?: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  notes?: string;
}

export interface PurchaseList {
  id: string;
  listNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  projectName: string;
  items: PurchaseItem[];
  notes: string;
  createdAt: string;
}
