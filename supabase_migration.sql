-- ============================================================
-- Supabase Migration: Welding POS — Full Cloud Database
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);

-- 2. CATALOG ITEMS
CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Nos',
  default_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'material'
    CHECK (category IN ('material', 'labor', 'service', 'other'))
);

ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to catalog_items" ON catalog_items FOR ALL USING (true) WITH CHECK (true);

-- 3. QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  quotation_number TEXT NOT NULL,
  date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  customer_email TEXT,
  project_name TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  visibility JSONB NOT NULL DEFAULT '{"showPrices":true,"showUnitPrice":true,"showTotal":true}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'converted')),
  project_images JSONB DEFAULT '[]'::jsonb,
  drawing_url TEXT,
  customer_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to quotations" ON quotations FOR ALL USING (true) WITH CHECK (true);

-- 4. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  quotation_id TEXT,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  customer_email TEXT,
  project_name TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'partially_paid', 'paid')),
  payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  visibility JSONB DEFAULT '{"showPrices":true,"showUnitPrice":true,"showTotal":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- 5. COMPANY SETTINGS (single-row pattern)
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone1 TEXT NOT NULL DEFAULT '',
  phone2 TEXT,
  email TEXT NOT NULL DEFAULT '',
  website TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'LKR',
  tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  quotation_prefix TEXT NOT NULL DEFAULT 'QT-',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
  default_quotation_terms TEXT NOT NULL DEFAULT '',
  default_invoice_terms TEXT NOT NULL DEFAULT '',
  thermal_printer_width TEXT NOT NULL DEFAULT '80mm'
    CHECK (thermal_printer_width IN ('58mm', '80mm')),
  bank_details TEXT NOT NULL DEFAULT ''
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Done! All 5 tables created with open RLS policies.
-- ============================================================

-- 6. PURCHASE LISTS
CREATE TABLE IF NOT EXISTS purchase_lists (
  id TEXT PRIMARY KEY,
  list_number TEXT NOT NULL,
  date TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  project_name TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE purchase_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to purchase_lists" ON purchase_lists FOR ALL USING (true) WITH CHECK (true);
