import { Router } from 'express';
import { getDb } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all bank accounts with GL account info
router.get('/accounts', (req, res) => {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT ba.*, a.account_number as gl_account_number, a.name as gl_account_name,
           (SELECT COUNT(*) FROM bank_transactions WHERE bank_account_id = ba.id) as transaction_count,
           (SELECT COUNT(*) FROM bank_transactions WHERE bank_account_id = ba.id AND is_cleared = 0) as uncleared_count
    FROM bank_accounts ba
    JOIN accounts a ON ba.account_id = a.id
    WHERE ba.is_active = 1
    ORDER BY a.account_number
  `).all();
  res.json(accounts);
});

// Get single bank account
router.get('/accounts/:id', (req, res) => {
  const db = getDb();
  const account = db.prepare(`
    SELECT ba.*, a.account_number as gl_account_number, a.name as gl_account_name
    FROM bank_accounts ba
    JOIN accounts a ON ba.account_id = a.id
    WHERE ba.id = ?
  `).get(req.params.id);
  
  if (!account) {
    return res.status(404).json({ error: 'Bank account not found' });
  }
  res.json(account);
});

// Get available GL accounts for bank account linking (Asset type, not already linked)
router.get('/available-gl-accounts', (req, res) => {
  const db = getDb();
  const accounts = db.prepare(`
    SELECT a.* FROM accounts a
    WHERE a.type = 'Asset' 
    AND a.is_active = 1
    AND a.id NOT IN (SELECT account_id FROM bank_accounts WHERE is_active = 1)
    ORDER BY a.account_number
  `).all();
  res.json(accounts);
});

// Create bank account
router.post('/accounts', (req, res) => {
  const db = getDb();
  const { account_id, bank_name, account_number_last4, routing_number, account_type, opening_balance, opening_balance_date } = req.body;
  
  const id = uuidv4();
  
  try {
    db.prepare(`
      INSERT INTO bank_accounts (id, account_id, bank_name, account_number_last4, routing_number, account_type, opening_balance, opening_balance_date, current_balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, account_id, bank_name, account_number_last4, routing_number, account_type || 'Checking', opening_balance || 0, opening_balance_date, opening_balance || 0);
    
    const account = db.prepare(`
      SELECT ba.*, a.account_number as gl_account_number, a.name as gl_account_name
      FROM bank_accounts ba
      JOIN accounts a ON ba.account_id = a.id
      WHERE ba.id = ?
    `).get(id);
    
    res.status(201).json(account);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update bank account
router.put('/accounts/:id', (req, res) => {
  const db = getDb();
  const { bank_name, account_number_last4, routing_number, account_type, is_active } = req.body;
  
  try {
    db.prepare(`
      UPDATE bank_accounts 
      SET bank_name = COALESCE(?, bank_name),
          account_number_last4 = COALESCE(?, account_number_last4),
          routing_number = COALESCE(?, routing_number),
          account_type = COALESCE(?, account_type),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(bank_name, account_number_last4, routing_number, account_type, is_active, req.params.id);
    
    const account = db.prepare(`
      SELECT ba.*, a.account_number as gl_account_number, a.name as gl_account_name
      FROM bank_accounts ba
      JOIN accounts a ON ba.account_id = a.id
      WHERE ba.id = ?
    `).get(req.params.id);
    
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get transactions for a bank account
router.get('/accounts/:id/transactions', (req, res) => {
  const db = getDb();
  const { cleared, start_date, end_date, limit = 500 } = req.query;
  
  let query = `
    SELECT bt.*, br.statement_date as reconciled_statement_date
    FROM bank_transactions bt
    LEFT JOIN bank_reconciliations br ON bt.reconciliation_id = br.id
    WHERE bt.bank_account_id = ?
  `;
  const params: any[] = [req.params.id];
  
  if (cleared !== undefined) {
    query += ' AND bt.is_cleared = ?';
    params.push(cleared === 'true' ? 1 : 0);
  }
  
  if (start_date) {
    query += ' AND bt.transaction_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND bt.transaction_date <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY bt.transaction_date DESC, bt.created_at DESC LIMIT ?';
  params.push(Number(limit));
  
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// Get uncleared transactions for reconciliation
router.get('/accounts/:id/uncleared', (req, res) => {
  const db = getDb();
  const { as_of_date } = req.query;
  
  let query = `
    SELECT * FROM bank_transactions
    WHERE bank_account_id = ?
    AND is_cleared = 0
  `;
  const params: any[] = [req.params.id];
  
  if (as_of_date) {
    query += ' AND transaction_date <= ?';
    params.push(as_of_date);
  }
  
  query += ' ORDER BY transaction_date ASC, created_at ASC';
  
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// Create transaction
router.post('/transactions', (req, res) => {
  const db = getDb();
  const { bank_account_id, transaction_date, transaction_type, check_number, payee, description, amount, reference } = req.body;
  
  const id = uuidv4();
  
  try {
    db.prepare(`
      INSERT INTO bank_transactions (id, bank_account_id, transaction_date, transaction_type, check_number, payee, description, amount, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, bank_account_id, transaction_date, transaction_type, check_number, payee, description, amount, reference);
    
    // Update current balance on bank account
    updateBankAccountBalance(db, bank_account_id);
    
    const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(id);
    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update transaction
router.put('/transactions/:id', (req, res) => {
  const db = getDb();
  const { transaction_date, transaction_type, check_number, payee, description, amount, reference } = req.body;
  
  try {
    const existing = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (existing.is_cleared) {
      return res.status(400).json({ error: 'Cannot modify a cleared transaction' });
    }
    
    db.prepare(`
      UPDATE bank_transactions 
      SET transaction_date = COALESCE(?, transaction_date),
          transaction_type = COALESCE(?, transaction_type),
          check_number = COALESCE(?, check_number),
          payee = COALESCE(?, payee),
          description = COALESCE(?, description),
          amount = COALESCE(?, amount),
          reference = COALESCE(?, reference),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(transaction_date, transaction_type, check_number, payee, description, amount, reference, req.params.id);
    
    updateBankAccountBalance(db, existing.bank_account_id);
    
    const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(req.params.id);
    res.json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/transactions/:id', (req, res) => {
  const db = getDb();
  
  try {
    const existing = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (existing.is_cleared) {
      return res.status(400).json({ error: 'Cannot delete a cleared transaction' });
    }
    
    db.prepare('DELETE FROM bank_transactions WHERE id = ?').run(req.params.id);
    updateBankAccountBalance(db, existing.bank_account_id);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get reconciliation history for an account
router.get('/accounts/:id/reconciliations', (req, res) => {
  const db = getDb();
  const reconciliations = db.prepare(`
    SELECT * FROM bank_reconciliations
    WHERE bank_account_id = ?
    ORDER BY statement_date DESC
  `).all(req.params.id);
  res.json(reconciliations);
});

// Get single reconciliation with details
router.get('/reconciliations/:id', (req, res) => {
  const db = getDb();
  const reconciliation = db.prepare(`
    SELECT br.*, ba.bank_name, a.account_number as gl_account_number, a.name as gl_account_name
    FROM bank_reconciliations br
    JOIN bank_accounts ba ON br.bank_account_id = ba.id
    JOIN accounts a ON ba.account_id = a.id
    WHERE br.id = ?
  `).get(req.params.id);
  
  if (!reconciliation) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }
  
  const clearedTransactions = db.prepare(`
    SELECT * FROM bank_transactions
    WHERE reconciliation_id = ?
    ORDER BY transaction_date ASC
  `).all(req.params.id);
  
  res.json({ ...reconciliation, cleared_transactions: clearedTransactions });
});

// Start a new reconciliation
router.post('/reconciliations', (req, res) => {
  const db = getDb();
  const { bank_account_id, statement_date, statement_ending_balance } = req.body;
  
  // Check for existing in-progress reconciliation
  const existing = db.prepare(`
    SELECT * FROM bank_reconciliations
    WHERE bank_account_id = ? AND status = 'In Progress'
  `).get(bank_account_id) as any;
  
  if (existing) {
    return res.status(400).json({ 
      error: 'An in-progress reconciliation already exists for this account',
      existing_id: existing.id
    });
  }
  
  // Get beginning balance (from last completed reconciliation or opening balance)
  const lastReconciliation = db.prepare(`
    SELECT statement_ending_balance, statement_date
    FROM bank_reconciliations
    WHERE bank_account_id = ? AND status = 'Completed'
    ORDER BY statement_date DESC
    LIMIT 1
  `).get(bank_account_id) as any;
  
  const bankAccount = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(bank_account_id) as any;
  
  const beginning_balance = lastReconciliation 
    ? lastReconciliation.statement_ending_balance 
    : bankAccount.opening_balance;
  
  const id = uuidv4();
  
  try {
    db.prepare(`
      INSERT INTO bank_reconciliations (id, bank_account_id, statement_date, statement_ending_balance, beginning_balance, difference)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, bank_account_id, statement_date, statement_ending_balance, beginning_balance, statement_ending_balance - beginning_balance);
    
    const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(id);
    res.status(201).json(reconciliation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update reconciliation (mark transactions as cleared/uncleared)
router.put('/reconciliations/:id/toggle-cleared', (req, res) => {
  const db = getDb();
  const { transaction_id, is_cleared } = req.body;
  
  const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id) as any;
  
  if (!reconciliation) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }
  
  if (reconciliation.status !== 'In Progress') {
    return res.status(400).json({ error: 'Cannot modify a completed reconciliation' });
  }
  
  const transaction = db.prepare('SELECT * FROM bank_transactions WHERE id = ?').get(transaction_id) as any;
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  if (transaction.bank_account_id !== reconciliation.bank_account_id) {
    return res.status(400).json({ error: 'Transaction does not belong to this bank account' });
  }
  
  try {
    if (is_cleared) {
      db.prepare(`
        UPDATE bank_transactions
        SET is_cleared = 1, cleared_date = ?, reconciliation_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(reconciliation.statement_date, req.params.id, transaction_id);
    } else {
      db.prepare(`
        UPDATE bank_transactions
        SET is_cleared = 0, cleared_date = NULL, reconciliation_id = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).run(transaction_id);
    }
    
    // Recalculate reconciliation totals
    const totals = recalculateReconciliationTotals(db, req.params.id);
    
    res.json(totals);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk update cleared status
router.put('/reconciliations/:id/bulk-toggle', (req, res) => {
  const db = getDb();
  const { transaction_ids, is_cleared } = req.body;
  
  const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id) as any;
  
  if (!reconciliation) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }
  
  if (reconciliation.status !== 'In Progress') {
    return res.status(400).json({ error: 'Cannot modify a completed reconciliation' });
  }
  
  try {
    const updateStmt = is_cleared
      ? db.prepare(`
          UPDATE bank_transactions
          SET is_cleared = 1, cleared_date = ?, reconciliation_id = ?, updated_at = datetime('now')
          WHERE id = ? AND bank_account_id = ?
        `)
      : db.prepare(`
          UPDATE bank_transactions
          SET is_cleared = 0, cleared_date = NULL, reconciliation_id = NULL, updated_at = datetime('now')
          WHERE id = ? AND bank_account_id = ?
        `);
    
    for (const txId of transaction_ids) {
      if (is_cleared) {
        updateStmt.run(reconciliation.statement_date, req.params.id, txId, reconciliation.bank_account_id);
      } else {
        updateStmt.run(txId, reconciliation.bank_account_id);
      }
    }
    
    const totals = recalculateReconciliationTotals(db, req.params.id);
    res.json(totals);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete reconciliation
router.put('/reconciliations/:id/complete', (req, res) => {
  const db = getDb();
  
  const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id) as any;
  
  if (!reconciliation) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }
  
  if (reconciliation.status !== 'In Progress') {
    return res.status(400).json({ error: 'Reconciliation is not in progress' });
  }
  
  // Recalculate to make sure we're current
  const totals = recalculateReconciliationTotals(db, req.params.id);
  
  if (Math.abs(totals.difference) > 0.005) {
    return res.status(400).json({ 
      error: 'Cannot complete reconciliation with a non-zero difference',
      difference: totals.difference
    });
  }
  
  try {
    db.prepare(`
      UPDATE bank_reconciliations
      SET status = 'Completed', completed_at = datetime('now'), completed_by = 'system', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);
    
    // Update bank account with last reconciliation info
    db.prepare(`
      UPDATE bank_accounts
      SET last_reconciled_date = ?, last_reconciled_balance = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(reconciliation.statement_date, reconciliation.statement_ending_balance, reconciliation.bank_account_id);
    
    const completed = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id);
    res.json(completed);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel/void reconciliation
router.put('/reconciliations/:id/void', (req, res) => {
  const db = getDb();
  
  const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id) as any;
  
  if (!reconciliation) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }
  
  if (reconciliation.status !== 'In Progress') {
    return res.status(400).json({ error: 'Can only void in-progress reconciliations' });
  }
  
  try {
    // Unclear all transactions associated with this reconciliation
    db.prepare(`
      UPDATE bank_transactions
      SET is_cleared = 0, cleared_date = NULL, reconciliation_id = NULL, updated_at = datetime('now')
      WHERE reconciliation_id = ?
    `).run(req.params.id);
    
    // Void the reconciliation
    db.prepare(`
      UPDATE bank_reconciliations
      SET status = 'Voided', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Undo a completed reconciliation (careful!)
router.put('/reconciliations/:id/undo', (req, res) => {
  const db = getDb();
  
  const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id) as any;
  
  if (!reconciliation) {
    return res.status(404).json({ error: 'Reconciliation not found' });
  }
  
  if (reconciliation.status !== 'Completed') {
    return res.status(400).json({ error: 'Can only undo completed reconciliations' });
  }
  
  // Check if there are later reconciliations
  const laterRecon = db.prepare(`
    SELECT * FROM bank_reconciliations
    WHERE bank_account_id = ? AND statement_date > ? AND status = 'Completed'
    LIMIT 1
  `).get(reconciliation.bank_account_id, reconciliation.statement_date) as any;
  
  if (laterRecon) {
    return res.status(400).json({ error: 'Cannot undo this reconciliation - there are later completed reconciliations' });
  }
  
  try {
    // Unclear all transactions associated with this reconciliation
    db.prepare(`
      UPDATE bank_transactions
      SET is_cleared = 0, cleared_date = NULL, reconciliation_id = NULL, updated_at = datetime('now')
      WHERE reconciliation_id = ?
    `).run(req.params.id);
    
    // Set back to in progress
    db.prepare(`
      UPDATE bank_reconciliations
      SET status = 'In Progress', completed_at = NULL, completed_by = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);
    
    // Update bank account last reconciled info
    const prevRecon = db.prepare(`
      SELECT * FROM bank_reconciliations
      WHERE bank_account_id = ? AND status = 'Completed'
      ORDER BY statement_date DESC
      LIMIT 1
    `).get(reconciliation.bank_account_id) as any;
    
    if (prevRecon) {
      db.prepare(`
        UPDATE bank_accounts
        SET last_reconciled_date = ?, last_reconciled_balance = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(prevRecon.statement_date, prevRecon.statement_ending_balance, reconciliation.bank_account_id);
    } else {
      db.prepare(`
        UPDATE bank_accounts
        SET last_reconciled_date = NULL, last_reconciled_balance = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).run(reconciliation.bank_account_id);
    }
    
    const updated = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Helper functions
function updateBankAccountBalance(db: any, bankAccountId: string) {
  const bankAccount = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(bankAccountId) as any;
  
  const txSum = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM bank_transactions
    WHERE bank_account_id = ?
  `).get(bankAccountId) as any;
  
  const currentBalance = bankAccount.opening_balance + txSum.total;
  
  db.prepare(`
    UPDATE bank_accounts SET current_balance = ?, updated_at = datetime('now') WHERE id = ?
  `).run(currentBalance, bankAccountId);
}

function recalculateReconciliationTotals(db: any, reconciliationId: string) {
  const reconciliation = db.prepare('SELECT * FROM bank_reconciliations WHERE id = ?').get(reconciliationId) as any;
  
  // Get sums of cleared transactions
  const clearedDeposits = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM bank_transactions
    WHERE reconciliation_id = ? AND amount > 0
  `).get(reconciliationId) as any;
  
  const clearedPayments = db.prepare(`
    SELECT COALESCE(SUM(ABS(amount)), 0) as total
    FROM bank_transactions
    WHERE reconciliation_id = ? AND amount < 0
  `).get(reconciliationId) as any;
  
  const cleared_deposits = clearedDeposits.total;
  const cleared_payments = clearedPayments.total;
  const cleared_balance = reconciliation.beginning_balance + cleared_deposits - cleared_payments;
  const difference = reconciliation.statement_ending_balance - cleared_balance;
  
  db.prepare(`
    UPDATE bank_reconciliations
    SET cleared_deposits = ?, cleared_payments = ?, cleared_balance = ?, difference = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(cleared_deposits, cleared_payments, cleared_balance, difference, reconciliationId);
  
  return {
    beginning_balance: reconciliation.beginning_balance,
    cleared_deposits,
    cleared_payments,
    cleared_balance,
    statement_ending_balance: reconciliation.statement_ending_balance,
    difference
  };
}

export const bankingRoutes = router;
