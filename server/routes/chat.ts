import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

const SYSTEM_PROMPT = `You are an AI assistant for NexusERP, an enterprise resource planning system for Nexus Manufacturing Co., a mid-size industrial equipment manufacturer.

You have access to execute SQL queries against the company's financial database. When users ask questions, generate and execute appropriate SQL queries to provide accurate, real-time data.

## Database Schema:

### Chart of Accounts (accounts)
- id, account_number, name, type (Asset/Liability/Equity/Revenue/Expense), sub_type, parent_id, description, is_active, normal_balance (Debit/Credit)

### General Ledger
**journal_entries**: id, entry_number, entry_date, period_id, description, reference, source, status (Draft/Posted/Reversed), total_debit, total_credit, created_by, posted_at
**journal_entry_lines**: id, journal_entry_id, account_id, debit, credit, description, line_number

### Accounts Payable
**vendors**: id, vendor_number, name, contact_name, email, phone, address, city, state, zip, payment_terms, tax_id, is_active
**ap_invoices**: id, invoice_number, vendor_id, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, balance_due, status (Draft/Open/Partial/Paid/Void/Overdue), description
**ap_payments**: id, payment_number, vendor_id, payment_date, amount, payment_method, reference

### Accounts Receivable
**customers**: id, customer_number, name, contact_name, email, phone, address, city, state, zip, payment_terms, credit_limit, is_active
**ar_invoices**: id, invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, balance_due, status (Draft/Open/Partial/Paid/Void/Overdue), description
**ar_payments**: id, payment_number, customer_id, payment_date, amount, payment_method, reference

### Procure to Pay
**purchase_requisitions**: id, requisition_number, requested_by, department, request_date, needed_by, status (Draft/Pending/Approved/Rejected/Converted), description, total_amount, approved_by
**purchase_orders**: id, po_number, vendor_id, requisition_id, order_date, expected_date, status (Draft/Sent/Acknowledged/Partial/Received/Closed/Cancelled), subtotal, total_amount
**purchase_order_lines**: id, purchase_order_id, line_number, description, quantity, unit_price, total_price, quantity_received
**goods_receipts**: id, receipt_number, purchase_order_id, receipt_date, received_by, status, notes

### Fiscal Periods (fiscal_periods)
- id, name, start_date, end_date, status (Open/Closed/Locked)

## Important Notes:
1. Today's date is ${new Date().toISOString().split('T')[0]}
2. All monetary values are in USD
3. For aging calculations, use date('now') vs due_date
4. Account types: Asset (1xxx), Liability (2xxx), Equity (3xxx), Revenue (4xxx), Expense (5xxx-6xxx)
5. Double-entry: debits must equal credits in all journal entries
6. Use SUM() with appropriate debit/credit logic for account balances

## Response Format:
When answering, provide clear explanations and format financial data nicely:
- Use tables for lists of data
- Format currency with $ and commas
- Include totals where relevant
- Highlight important insights

If you need to run a SQL query to answer, wrap it in a <sql> tag like this:
<sql>SELECT * FROM vendors LIMIT 5</sql>

I will execute the query and provide results, then you can format and explain them.

For CREATE/INSERT operations, I can execute those too - just explain what you're creating first.`;

router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const db = getDb();
    
    // Build conversation messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: message }
    ];

    // Call Clawdbot gateway
    const gatewayToken = process.env.CLAWDBOT_GATEWAY_TOKEN || 'f7e843783d402218a0d07f898b4ac963ee3270aad8e46860';
    const response = await fetch('http://localhost:18789/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayToken}`
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        messages,
        max_tokens: 4096,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gateway error:', error);
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || '';

    // Extract and execute SQL queries
    const sqlRegex = /<sql>([\s\S]*?)<\/sql>/gi;
    let match;
    const queryResults: { query: string; results: any; error?: string }[] = [];

    while ((match = sqlRegex.exec(aiResponse)) !== null) {
      const query = match[1].trim();
      try {
        // Determine if it's a SELECT or modifying query
        const isSelect = query.trim().toUpperCase().startsWith('SELECT');
        let results;
        if (isSelect) {
          results = db.prepare(query).all();
        } else {
          // For INSERT/UPDATE/DELETE, run and return info
          const info = db.prepare(query).run();
          results = { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
        }
        queryResults.push({ query, results });
      } catch (err: any) {
        queryResults.push({ query, results: null, error: err.message });
      }
    }

    // If we got query results, send them back to the AI for formatting
    if (queryResults.length > 0) {
      const resultsMessage = queryResults.map((qr, i) => {
        if (qr.error) {
          return `Query ${i + 1} error: ${qr.error}`;
        }
        return `Query ${i + 1} results:\n\`\`\`json\n${JSON.stringify(qr.results, null, 2)}\n\`\`\``;
      }).join('\n\n');

      // Get a follow-up response with the actual data
      const followUpMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse },
        { role: 'user', content: `Here are the query results:\n\n${resultsMessage}\n\nPlease format these results nicely for the user. Use markdown tables where appropriate. Format currency values with $ and commas.` }
      ];

      const followUpResponse = await fetch('http://localhost:18789/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-20250514',
          messages: followUpMessages,
          max_tokens: 4096,
          temperature: 0.3
        })
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        aiResponse = followUpData.choices?.[0]?.message?.content || aiResponse;
      }
    }

    res.json({
      response: aiResponse,
      queryResults
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const chatRoute = router;
