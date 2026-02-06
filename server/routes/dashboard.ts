import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();

  // Cash position
  const cashPosition = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN a.normal_balance = 'Debit' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END), 0) as balance
    FROM journal_entry_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.account_number IN ('1010', '1020')
    AND je.status = 'Posted'
  `).get() as { balance: number };

  // Total receivables
  const receivables = db.prepare(`
    SELECT COALESCE(SUM(balance_due), 0) as total FROM ar_invoices WHERE status NOT IN ('Paid', 'Void')
  `).get() as { total: number };

  // Total payables
  const payables = db.prepare(`
    SELECT COALESCE(SUM(balance_due), 0) as total FROM ap_invoices WHERE status NOT IN ('Paid', 'Void')
  `).get() as { total: number };

  // Revenue YTD (from posted journal entries to revenue accounts)
  const revenueYTD = db.prepare(`
    SELECT COALESCE(SUM(jl.credit - jl.debit), 0) as total
    FROM journal_entry_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Revenue'
    AND je.status = 'Posted'
    AND je.entry_date >= date('now', 'start of year')
  `).get() as { total: number };

  // Expenses YTD
  const expensesYTD = db.prepare(`
    SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as total
    FROM journal_entry_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Expense'
    AND je.status = 'Posted'
    AND je.entry_date >= date('now', 'start of year')
  `).get() as { total: number };

  // AP Aging
  const apAging = db.prepare(`
    SELECT 
      SUM(CASE WHEN julianday('now') - julianday(due_date) <= 0 THEN balance_due ELSE 0 END) as current,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 0 AND julianday('now') - julianday(due_date) <= 30 THEN balance_due ELSE 0 END) as days_1_30,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 30 AND julianday('now') - julianday(due_date) <= 60 THEN balance_due ELSE 0 END) as days_31_60,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 60 AND julianday('now') - julianday(due_date) <= 90 THEN balance_due ELSE 0 END) as days_61_90,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 90 THEN balance_due ELSE 0 END) as days_over_90
    FROM ap_invoices
    WHERE status NOT IN ('Paid', 'Void')
  `).get() as any;

  // AR Aging
  const arAging = db.prepare(`
    SELECT 
      SUM(CASE WHEN julianday('now') - julianday(due_date) <= 0 THEN balance_due ELSE 0 END) as current,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 0 AND julianday('now') - julianday(due_date) <= 30 THEN balance_due ELSE 0 END) as days_1_30,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 30 AND julianday('now') - julianday(due_date) <= 60 THEN balance_due ELSE 0 END) as days_31_60,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 60 AND julianday('now') - julianday(due_date) <= 90 THEN balance_due ELSE 0 END) as days_61_90,
      SUM(CASE WHEN julianday('now') - julianday(due_date) > 90 THEN balance_due ELSE 0 END) as days_over_90
    FROM ar_invoices
    WHERE status NOT IN ('Paid', 'Void')
  `).get() as any;

  // Recent transactions
  const recentTransactions = db.prepare(`
    SELECT 
      je.id,
      je.entry_number,
      je.entry_date,
      je.description,
      je.total_debit as amount,
      je.source,
      je.status
    FROM journal_entries je
    ORDER BY je.entry_date DESC, je.created_at DESC
    LIMIT 10
  `).all();

  // Monthly revenue trend (last 6 months)
  const revenueTrend = db.prepare(`
    SELECT 
      strftime('%Y-%m', je.entry_date) as month,
      COALESCE(SUM(jl.credit - jl.debit), 0) as revenue
    FROM journal_entry_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Revenue'
    AND je.status = 'Posted'
    AND je.entry_date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', je.entry_date)
    ORDER BY month
  `).all();

  // Monthly expenses trend (last 6 months)
  const expenseTrend = db.prepare(`
    SELECT 
      strftime('%Y-%m', je.entry_date) as month,
      COALESCE(SUM(jl.debit - jl.credit), 0) as expenses
    FROM journal_entry_lines jl
    JOIN accounts a ON jl.account_id = a.id
    JOIN journal_entries je ON jl.journal_entry_id = je.id
    WHERE a.type = 'Expense'
    AND je.status = 'Posted'
    AND je.entry_date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', je.entry_date)
    ORDER BY month
  `).all();

  // Open POs count
  const openPOs = db.prepare(`
    SELECT COUNT(*) as count FROM purchase_orders WHERE status NOT IN ('Received', 'Closed', 'Cancelled')
  `).get() as { count: number };

  // Pending requisitions
  const pendingReqs = db.prepare(`
    SELECT COUNT(*) as count FROM purchase_requisitions WHERE status = 'Pending'
  `).get() as { count: number };

  res.json({
    cashPosition: cashPosition.balance,
    receivables: receivables.total,
    payables: payables.total,
    revenueYTD: revenueYTD.total,
    expensesYTD: expensesYTD.total,
    netIncome: revenueYTD.total - expensesYTD.total,
    apAging,
    arAging,
    recentTransactions,
    revenueTrend,
    expenseTrend,
    openPOs: openPOs.count,
    pendingReqs: pendingReqs.count
  });
});

export const dashboardRoute = router;
