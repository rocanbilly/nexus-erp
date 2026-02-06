import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Get chart of accounts
router.get('/accounts', (req, res) => {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT 
      a.*,
      COALESCE((
        SELECT 
          CASE WHEN a.normal_balance = 'Debit' 
            THEN SUM(jl.debit - jl.credit) 
            ELSE SUM(jl.credit - jl.debit) 
          END
        FROM journal_entry_lines jl
        JOIN journal_entries je ON jl.journal_entry_id = je.id
        WHERE jl.account_id = a.id AND je.status = 'Posted'
      ), 0) as balance
    FROM accounts a
    ORDER BY a.account_number
  `).all();
  res.json(accounts);
});

// Get single account with transactions
router.get('/accounts/:id', (req, res) => {
  const db = getDb();
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const transactions = db.prepare(`
    SELECT 
      je.entry_number,
      je.entry_date,
      je.description as je_description,
      jl.debit,
      jl.credit,
      jl.description
    FROM journal_entry_lines jl
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE jl.account_id = ?
    AND je.status = 'Posted'
    ORDER BY je.entry_date DESC, je.entry_number DESC
    LIMIT 100
  `).all(req.params.id);

  res.json({ account, transactions });
});

// Get journal entries
router.get('/journal-entries', (req, res) => {
  const db = getDb();
  const { status, startDate, endDate, limit = 50 } = req.query;

  let query = `
    SELECT 
      je.*,
      (SELECT COUNT(*) FROM journal_entry_lines WHERE journal_entry_id = je.id) as line_count
    FROM journal_entries je
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND je.status = ?';
    params.push(status);
  }
  if (startDate) {
    query += ' AND je.entry_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND je.entry_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY je.entry_date DESC, je.entry_number DESC LIMIT ?';
  params.push(Number(limit));

  const entries = db.prepare(query).all(...params);
  res.json(entries);
});

// Get single journal entry with lines
router.get('/journal-entries/:id', (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id);
  
  if (!entry) {
    return res.status(404).json({ error: 'Journal entry not found' });
  }

  const lines = db.prepare(`
    SELECT 
      jl.*,
      a.account_number,
      a.name as account_name
    FROM journal_entry_lines jl
    JOIN accounts a ON jl.account_id = a.id
    WHERE jl.journal_entry_id = ?
    ORDER BY jl.line_number
  `).all(req.params.id);

  res.json({ entry, lines });
});

// Get trial balance
router.get('/trial-balance', (req, res) => {
  const db = getDb();
  const { asOfDate } = req.query;
  const dateFilter = asOfDate ? `AND je.entry_date <= ?` : '';
  const params = asOfDate ? [asOfDate] : [];

  const trialBalance = db.prepare(`
    SELECT 
      a.account_number,
      a.name,
      a.type,
      a.normal_balance,
      COALESCE(SUM(jl.debit), 0) as total_debits,
      COALESCE(SUM(jl.credit), 0) as total_credits,
      CASE 
        WHEN a.normal_balance = 'Debit' THEN COALESCE(SUM(jl.debit - jl.credit), 0)
        ELSE COALESCE(SUM(jl.credit - jl.debit), 0)
      END as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'Posted' ${dateFilter}
    WHERE a.sub_type != 'Header'
    GROUP BY a.id, a.account_number, a.name, a.type, a.normal_balance
    HAVING COALESCE(SUM(jl.debit), 0) != 0 OR COALESCE(SUM(jl.credit), 0) != 0
    ORDER BY a.account_number
  `).all(...params);

  // Calculate totals
  let totalDebits = 0;
  let totalCredits = 0;
  for (const row of trialBalance as any[]) {
    totalDebits += row.total_debits;
    totalCredits += row.total_credits;
  }

  res.json({
    accounts: trialBalance,
    totals: { totalDebits, totalCredits },
    balanced: Math.abs(totalDebits - totalCredits) < 0.01
  });
});

// Get income statement
router.get('/income-statement', (req, res) => {
  const db = getDb();
  const { startDate, endDate } = req.query;
  
  let dateFilter = '';
  const params: string[] = [];
  if (startDate) {
    dateFilter += ' AND je.entry_date >= ?';
    params.push(startDate as string);
  }
  if (endDate) {
    dateFilter += ' AND je.entry_date <= ?';
    params.push(endDate as string);
  }

  const revenues = db.prepare(`
    SELECT 
      a.account_number,
      a.name,
      COALESCE(SUM(jl.credit - jl.debit), 0) as amount
    FROM accounts a
    LEFT JOIN journal_entry_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'Posted' ${dateFilter}
    WHERE a.type = 'Revenue'
    AND a.sub_type != 'Header'
    GROUP BY a.id
    HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
    ORDER BY a.account_number
  `).all(...params) as any[];

  const expenses = db.prepare(`
    SELECT 
      a.account_number,
      a.name,
      COALESCE(SUM(jl.debit - jl.credit), 0) as amount
    FROM accounts a
    LEFT JOIN journal_entry_lines jl ON a.id = jl.account_id
    LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'Posted' ${dateFilter}
    WHERE a.type = 'Expense'
    AND a.sub_type != 'Header'
    GROUP BY a.id
    HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
    ORDER BY a.account_number
  `).all(...params) as any[];

  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  res.json({
    revenues,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses
  });
});

// Get fiscal periods
router.get('/periods', (req, res) => {
  const db = getDb();
  const periods = db.prepare('SELECT * FROM fiscal_periods ORDER BY start_date DESC').all();
  res.json(periods);
});

export const glRoutes = router;
