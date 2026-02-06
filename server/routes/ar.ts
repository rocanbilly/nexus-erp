import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Get all customers
router.get('/customers', (req, res) => {
  const db = getDb();
  const customers = db.prepare(`
    SELECT 
      c.*,
      COALESCE((SELECT SUM(balance_due) FROM ar_invoices WHERE customer_id = c.id AND status NOT IN ('Paid', 'Void')), 0) as open_balance,
      (SELECT COUNT(*) FROM ar_invoices WHERE customer_id = c.id AND status NOT IN ('Paid', 'Void')) as open_invoices
    FROM customers c
    ORDER BY c.name
  `).all();
  res.json(customers);
});

// Get single customer with invoices
router.get('/customers/:id', (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const invoices = db.prepare(`
    SELECT * FROM ar_invoices 
    WHERE customer_id = ? 
    ORDER BY invoice_date DESC
  `).all(req.params.id);

  const payments = db.prepare(`
    SELECT * FROM ar_payments 
    WHERE customer_id = ? 
    ORDER BY payment_date DESC
  `).all(req.params.id);

  res.json({ customer, invoices, payments });
});

// Get all AR invoices
router.get('/invoices', (req, res) => {
  const db = getDb();
  const { status, customerId, startDate, endDate } = req.query;

  let query = `
    SELECT 
      i.*,
      c.name as customer_name,
      c.customer_number,
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
    FROM ar_invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (customerId) {
    query += ' AND i.customer_id = ?';
    params.push(customerId);
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

// Get single AR invoice
router.get('/invoices/:id', (req, res) => {
  const db = getDb();
  const invoice = db.prepare(`
    SELECT 
      i.*,
      c.name as customer_name,
      c.customer_number,
      c.address,
      c.city,
      c.state,
      c.zip,
      c.payment_terms,
      c.credit_limit
    FROM ar_invoices i
    JOIN customers c ON i.customer_id = c.id
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
    FROM ar_payment_applications pa
    JOIN ar_payments p ON pa.payment_id = p.id
    WHERE pa.invoice_id = ?
    ORDER BY p.payment_date
  `).all(req.params.id);

  res.json({ invoice, payments });
});

// Get AR aging report
router.get('/aging', (req, res) => {
  const db = getDb();
  
  const aging = db.prepare(`
    SELECT 
      c.id as customer_id,
      c.customer_number,
      c.name as customer_name,
      c.credit_limit,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) <= 0 THEN i.balance_due ELSE 0 END) as current,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 0 AND julianday('now') - julianday(i.due_date) <= 30 THEN i.balance_due ELSE 0 END) as days_1_30,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 30 AND julianday('now') - julianday(i.due_date) <= 60 THEN i.balance_due ELSE 0 END) as days_31_60,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 60 AND julianday('now') - julianday(i.due_date) <= 90 THEN i.balance_due ELSE 0 END) as days_61_90,
      SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 90 THEN i.balance_due ELSE 0 END) as days_over_90,
      SUM(i.balance_due) as total
    FROM ar_invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.status NOT IN ('Paid', 'Void')
    GROUP BY c.id, c.customer_number, c.name, c.credit_limit
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
      c.name as customer_name,
      c.customer_number
    FROM ar_payments p
    JOIN customers c ON p.customer_id = c.id
    ORDER BY p.payment_date DESC
    LIMIT 100
  `).all();
  res.json(payments);
});

// Get collection queue (overdue invoices)
router.get('/collections', (req, res) => {
  const db = getDb();
  const queue = db.prepare(`
    SELECT 
      i.*,
      c.name as customer_name,
      c.customer_number,
      c.contact_name,
      c.email,
      c.phone,
      julianday('now') - julianday(i.due_date) as days_overdue
    FROM ar_invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.status NOT IN ('Paid', 'Void')
    AND i.balance_due > 0
    AND julianday('now') > julianday(i.due_date)
    ORDER BY i.due_date ASC
  `).all();
  res.json(queue);
});

export const arRoutes = router;
