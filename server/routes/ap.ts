import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Get all vendors
router.get('/vendors', (req, res) => {
  const db = getDb();
  const vendors = db.prepare(`
    SELECT 
      v.*,
      COALESCE((SELECT SUM(balance_due) FROM ap_invoices WHERE vendor_id = v.id AND status NOT IN ('Paid', 'Void')), 0) as open_balance,
      (SELECT COUNT(*) FROM ap_invoices WHERE vendor_id = v.id AND status NOT IN ('Paid', 'Void')) as open_invoices
    FROM vendors v
    ORDER BY v.name
  `).all();
  res.json(vendors);
});

// Get single vendor with invoices
router.get('/vendors/:id', (req, res) => {
  const db = getDb();
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }

  const invoices = db.prepare(`
    SELECT * FROM ap_invoices 
    WHERE vendor_id = ? 
    ORDER BY invoice_date DESC
  `).all(req.params.id);

  const payments = db.prepare(`
    SELECT * FROM ap_payments 
    WHERE vendor_id = ? 
    ORDER BY payment_date DESC
  `).all(req.params.id);

  res.json({ vendor, invoices, payments });
});

// Get all AP invoices
router.get('/invoices', (req, res) => {
  const db = getDb();
  const { status, vendorId, startDate, endDate } = req.query;

  let query = `
    SELECT 
      i.*,
      v.name as vendor_name,
      v.vendor_number,
      CASE 
        WHEN i.status NOT IN ('Paid', 'Void') AND julianday('now') > julianday(i.due_date) THEN 'Overdue'
        ELSE i.status
      END as current_status,
      CASE 
        WHEN julianday('now') - julianday(i.due_date) <= 0 THEN 'current'
        WHEN julianday('now') - julianday(i.due_date) <= 30 THEN '1-30'
        WHEN julianday('now') - julianday(i.due_date) <= 60 THEN '31-60'
        WHEN julianday('now') - julianday(i.due_date) <= 90 THEN '61-90'
        ELSE '90+'
      END as aging_bucket
    FROM ap_invoices i
    JOIN vendors v ON i.vendor_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (vendorId) {
    query += ' AND i.vendor_id = ?';
    params.push(vendorId);
  }
  if (startDate) {
    query += ' AND i.invoice_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND i.invoice_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY i.due_date ASC, i.invoice_date DESC';

  const invoices = db.prepare(query).all(...params);
  res.json(invoices);
});

// Get single AP invoice
router.get('/invoices/:id', (req, res) => {
  const db = getDb();
  const invoice = db.prepare(`
    SELECT 
      i.*,
      v.name as vendor_name,
      v.vendor_number,
      v.address,
      v.city,
      v.state,
      v.zip,
      v.payment_terms
    FROM ap_invoices i
    JOIN vendors v ON i.vendor_id = v.id
    WHERE i.id = ?
  `).get(req.params.id);
  
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const payments = db.prepare(`
    SELECT 
      p.payment_number,
      p.payment_date,
      pa.amount
    FROM ap_payment_applications pa
    JOIN ap_payments p ON pa.payment_id = p.id
    WHERE pa.invoice_id = ?
    ORDER BY p.payment_date
  `).all(req.params.id);

  res.json({ invoice, payments });
});

// Get AP aging report
router.get('/aging', (req, res) => {
  const db = getDb();
  
  const aging = db.prepare(`
    SELECT 
      v.id as vendor_id,
      v.vendor_number,
      v.name as vendor_name,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) <= 0 THEN i.balance_due ELSE 0 END) as current,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 0 AND julianday('now') - julianday(i.due_date) <= 30 THEN i.balance_due ELSE 0 END) as days_1_30,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 30 AND julianday('now') - julianday(i.due_date) <= 60 THEN i.balance_due ELSE 0 END) as days_31_60,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 60 AND julianday('now') - julianday(i.due_date) <= 90 THEN i.balance_due ELSE 0 END) as days_61_90,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 90 THEN i.balance_due ELSE 0 END) as days_over_90,
      SUM(i.balance_due) as total
    FROM ap_invoices i
    JOIN vendors v ON i.vendor_id = v.id
    WHERE i.status NOT IN ('Paid', 'Void')
    GROUP BY v.id, v.vendor_number, v.name
    HAVING SUM(i.balance_due) > 0
    ORDER BY SUM(i.balance_due) DESC
  `).all();

  // Calculate totals
  const totals = {
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_over_90: 0,
    total: 0
  };

  for (const row of aging as any[]) {
    totals.current += row.current || 0;
    totals.days_1_30 += row.days_1_30 || 0;
    totals.days_31_60 += row.days_31_60 || 0;
    totals.days_61_90 += row.days_61_90 || 0;
    totals.days_over_90 += row.days_over_90 || 0;
    totals.total += row.total || 0;
  }

  res.json({ aging, totals });
});

// Get payments
router.get('/payments', (req, res) => {
  const db = getDb();
  const payments = db.prepare(`
    SELECT 
      p.*,
      v.name as vendor_name,
      v.vendor_number
    FROM ap_payments p
    JOIN vendors v ON p.vendor_id = v.id
    ORDER BY p.payment_date DESC
    LIMIT 100
  `).all();
  res.json(payments);
});

// Get payment queue (invoices due soon)
router.get('/payment-queue', (req, res) => {
  const db = getDb();
  const queue = db.prepare(`
    SELECT 
      i.*,
      v.name as vendor_name,
      v.vendor_number,
      v.payment_terms,
      julianday(i.due_date) - julianday('now') as days_until_due
    FROM ap_invoices i
    JOIN vendors v ON i.vendor_id = v.id
    WHERE i.status NOT IN ('Paid', 'Void')
    AND i.balance_due > 0
    ORDER BY i.due_date ASC
    LIMIT 50
  `).all();
  res.json(queue);
});

export const apRoutes = router;
