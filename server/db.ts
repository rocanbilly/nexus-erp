import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'erp.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    -- Chart of Accounts
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      account_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
      sub_type TEXT,
      parent_id TEXT REFERENCES accounts(id),
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      normal_balance TEXT NOT NULL CHECK (normal_balance IN ('Debit', 'Credit')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Fiscal Periods
    CREATE TABLE IF NOT EXISTS fiscal_periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Locked')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Journal Entries (header)
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      entry_number TEXT NOT NULL UNIQUE,
      entry_date TEXT NOT NULL,
      period_id TEXT REFERENCES fiscal_periods(id),
      description TEXT NOT NULL,
      reference TEXT,
      source TEXT DEFAULT 'Manual',
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Posted', 'Reversed')),
      total_debit REAL NOT NULL DEFAULT 0,
      total_credit REAL NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      posted_at TEXT
    );

    -- Journal Entry Lines (detail)
    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id TEXT PRIMARY KEY,
      journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      description TEXT,
      line_number INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Vendors
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      vendor_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      payment_terms TEXT DEFAULT 'Net 30',
      tax_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- AP Invoices
    CREATE TABLE IF NOT EXISTS ap_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft', 'Open', 'Partial', 'Paid', 'Void', 'Overdue')),
      description TEXT,
      gl_account_id TEXT REFERENCES accounts(id),
      journal_entry_id TEXT REFERENCES journal_entries(id),
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- AP Payments
    CREATE TABLE IF NOT EXISTS ap_payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT NOT NULL UNIQUE,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Check',
      reference TEXT,
      journal_entry_id TEXT REFERENCES journal_entries(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ap_payment_applications (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL REFERENCES ap_payments(id),
      invoice_id TEXT NOT NULL REFERENCES ap_invoices(id),
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      customer_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      payment_terms TEXT DEFAULT 'Net 30',
      credit_limit REAL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- AR Invoices
    CREATE TABLE IF NOT EXISTS ar_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      amount_paid REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft', 'Open', 'Partial', 'Paid', 'Void', 'Overdue')),
      description TEXT,
      gl_account_id TEXT REFERENCES accounts(id),
      journal_entry_id TEXT REFERENCES journal_entries(id),
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- AR Payments
    CREATE TABLE IF NOT EXISTS ar_payments (
      id TEXT PRIMARY KEY,
      payment_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Check',
      reference TEXT,
      journal_entry_id TEXT REFERENCES journal_entries(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ar_payment_applications (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL REFERENCES ar_payments(id),
      invoice_id TEXT NOT NULL REFERENCES ar_invoices(id),
      amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Purchase Requisitions
    CREATE TABLE IF NOT EXISTS purchase_requisitions (
      id TEXT PRIMARY KEY,
      requisition_number TEXT NOT NULL UNIQUE,
      requested_by TEXT NOT NULL,
      department TEXT,
      request_date TEXT NOT NULL,
      needed_by TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Converted')),
      description TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_requisition_lines (
      id TEXT PRIMARY KEY,
      requisition_id TEXT NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
      line_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      gl_account_id TEXT REFERENCES accounts(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Purchase Orders
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT NOT NULL UNIQUE,
      vendor_id TEXT NOT NULL REFERENCES vendors(id),
      requisition_id TEXT REFERENCES purchase_requisitions(id),
      order_date TEXT NOT NULL,
      expected_date TEXT,
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Acknowledged', 'Partial', 'Received', 'Closed', 'Cancelled')),
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      shipping_address TEXT,
      notes TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_order_lines (
      id TEXT PRIMARY KEY,
      purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      line_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      quantity_received REAL NOT NULL DEFAULT 0,
      gl_account_id TEXT REFERENCES accounts(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Goods Receipts
    CREATE TABLE IF NOT EXISTS goods_receipts (
      id TEXT PRIMARY KEY,
      receipt_number TEXT NOT NULL UNIQUE,
      purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id),
      receipt_date TEXT NOT NULL,
      received_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Complete' CHECK (status IN ('Partial', 'Complete', 'Rejected')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goods_receipt_lines (
      id TEXT PRIMARY KEY,
      receipt_id TEXT NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
      po_line_id TEXT NOT NULL REFERENCES purchase_order_lines(id),
      quantity_received REAL NOT NULL,
      condition TEXT DEFAULT 'Good',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bank Accounts (links to chart of accounts)
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      bank_name TEXT NOT NULL,
      account_number_last4 TEXT,
      routing_number TEXT,
      account_type TEXT DEFAULT 'Checking' CHECK (account_type IN ('Checking', 'Savings', 'Money Market', 'Credit Card')),
      opening_balance REAL NOT NULL DEFAULT 0,
      opening_balance_date TEXT NOT NULL,
      current_balance REAL NOT NULL DEFAULT 0,
      last_reconciled_date TEXT,
      last_reconciled_balance REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bank Transactions
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id TEXT PRIMARY KEY,
      bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
      transaction_date TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Deposit', 'Withdrawal', 'Check', 'Transfer', 'Fee', 'Interest', 'Adjustment')),
      check_number TEXT,
      payee TEXT,
      description TEXT,
      amount REAL NOT NULL,
      is_cleared INTEGER NOT NULL DEFAULT 0,
      cleared_date TEXT,
      reconciliation_id TEXT REFERENCES bank_reconciliations(id),
      reference TEXT,
      journal_entry_id TEXT REFERENCES journal_entries(id),
      ap_payment_id TEXT REFERENCES ap_payments(id),
      ar_payment_id TEXT REFERENCES ar_payments(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bank Reconciliations (header)
    CREATE TABLE IF NOT EXISTS bank_reconciliations (
      id TEXT PRIMARY KEY,
      bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
      statement_date TEXT NOT NULL,
      statement_ending_balance REAL NOT NULL,
      beginning_balance REAL NOT NULL,
      cleared_deposits REAL NOT NULL DEFAULT 0,
      cleared_payments REAL NOT NULL DEFAULT 0,
      cleared_balance REAL NOT NULL DEFAULT 0,
      difference REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Completed', 'Voided')),
      completed_at TEXT,
      completed_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Audit Trail
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
      old_values TEXT,
      new_values TEXT,
      changed_by TEXT NOT NULL DEFAULT 'system',
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
    CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(account_id);
    CREATE INDEX IF NOT EXISTS idx_ap_invoices_vendor ON ap_invoices(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_ap_invoices_status ON ap_invoices(status);
    CREATE INDEX IF NOT EXISTS idx_ap_invoices_due_date ON ap_invoices(due_date);
    CREATE INDEX IF NOT EXISTS idx_ar_invoices_customer ON ar_invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_ar_invoices_status ON ar_invoices(status);
    CREATE INDEX IF NOT EXISTS idx_ar_invoices_due_date ON ar_invoices(due_date);
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor ON purchase_orders(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name, record_id);
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id);
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_bank_transactions_cleared ON bank_transactions(is_cleared);
    CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_account ON bank_reconciliations(bank_account_id);
  `);
}
