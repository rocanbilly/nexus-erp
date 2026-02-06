import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Get purchase requisitions
router.get('/requisitions', (req, res) => {
  const db = getDb();
  const { status } = req.query;

  let query = `
    SELECT 
      r.*,
      (SELECT COUNT(*) FROM purchase_requisition_lines WHERE requisition_id = r.id) as line_count
    FROM purchase_requisitions r
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.request_date DESC';

  const requisitions = db.prepare(query).all(...params);
  res.json(requisitions);
});

// Get single requisition with lines
router.get('/requisitions/:id', (req, res) => {
  const db = getDb();
  const requisition = db.prepare('SELECT * FROM purchase_requisitions WHERE id = ?').get(req.params.id);
  
  if (!requisition) {
    return res.status(404).json({ error: 'Requisition not found' });
  }

  const lines = db.prepare(`
    SELECT 
      l.*,
      a.account_number,
      a.name as account_name
    FROM purchase_requisition_lines l
    LEFT JOIN accounts a ON l.gl_account_id = a.id
    WHERE l.requisition_id = ?
    ORDER BY l.line_number
  `).all(req.params.id);

  res.json({ requisition, lines });
});

// Get purchase orders
router.get('/purchase-orders', (req, res) => {
  const db = getDb();
  const { status, vendorId } = req.query;

  let query = `
    SELECT 
      po.*,
      v.name as vendor_name,
      v.vendor_number,
      (SELECT COUNT(*) FROM purchase_order_lines WHERE purchase_order_id = po.id) as line_count,
      (SELECT COALESCE(SUM(quantity_received), 0) FROM purchase_order_lines WHERE purchase_order_id = po.id) as total_received,
      (SELECT COALESCE(SUM(quantity), 0) FROM purchase_order_lines WHERE purchase_order_id = po.id) as total_ordered
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += ' AND po.status = ?';
    params.push(status);
  }
  if (vendorId) {
    query += ' AND po.vendor_id = ?';
    params.push(vendorId);
  }

  query += ' ORDER BY po.order_date DESC';

  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

// Get single PO with lines
router.get('/purchase-orders/:id', (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT 
      po.*,
      v.name as vendor_name,
      v.vendor_number,
      v.address,
      v.city,
      v.state,
      v.zip,
      v.payment_terms
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    WHERE po.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }

  const lines = db.prepare(`
    SELECT 
      l.*,
      a.account_number,
      a.name as account_name
    FROM purchase_order_lines l
    LEFT JOIN accounts a ON l.gl_account_id = a.id
    WHERE l.purchase_order_id = ?
    ORDER BY l.line_number
  `).all(req.params.id);

  const receipts = db.prepare(`
    SELECT * FROM goods_receipts
    WHERE purchase_order_id = ?
    ORDER BY receipt_date DESC
  `).all(req.params.id);

  res.json({ order, lines, receipts });
});

// Get goods receipts
router.get('/receipts', (req, res) => {
  const db = getDb();
  const receipts = db.prepare(`
    SELECT 
      gr.*,
      po.po_number,
      v.name as vendor_name
    FROM goods_receipts gr
    JOIN purchase_orders po ON gr.purchase_order_id = po.id
    JOIN vendors v ON po.vendor_id = v.id
    ORDER BY gr.receipt_date DESC
    LIMIT 100
  `).all();
  res.json(receipts);
});

// Get single receipt with lines
router.get('/receipts/:id', (req, res) => {
  const db = getDb();
  const receipt = db.prepare(`
    SELECT 
      gr.*,
      po.po_number,
      v.name as vendor_name
    FROM goods_receipts gr
    JOIN purchase_orders po ON gr.purchase_order_id = po.id
    JOIN vendors v ON po.vendor_id = v.id
    WHERE gr.id = ?
  `).get(req.params.id);
  
  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  const lines = db.prepare(`
    SELECT 
      grl.*,
      pol.description,
      pol.quantity as ordered_quantity,
      pol.unit_price
    FROM goods_receipt_lines grl
    JOIN purchase_order_lines pol ON grl.po_line_id = pol.id
    WHERE grl.receipt_id = ?
  `).all(req.params.id);

  res.json({ receipt, lines });
});

// 3-way match view
router.get('/three-way-match', (req, res) => {
  const db = getDb();
  const matches = db.prepare(`
    SELECT 
      po.id as po_id,
      po.po_number,
      po.order_date,
      po.total_amount as po_amount,
      po.status as po_status,
      v.name as vendor_name,
      COALESCE((
        SELECT SUM(grl.quantity_received * pol.unit_price)
        FROM goods_receipts gr
        JOIN goods_receipt_lines grl ON gr.id = grl.receipt_id
        JOIN purchase_order_lines pol ON grl.po_line_id = pol.id
        WHERE gr.purchase_order_id = po.id
      ), 0) as received_amount,
      COALESCE((
        SELECT SUM(i.total_amount)
        FROM ap_invoices i
        WHERE i.description LIKE '%' || po.po_number || '%'
      ), 0) as invoiced_amount,
      CASE 
        WHEN po.total_amount = COALESCE((
          SELECT SUM(grl.quantity_received * pol.unit_price)
          FROM goods_receipts gr
          JOIN goods_receipt_lines grl ON gr.id = grl.receipt_id
          JOIN purchase_order_lines pol ON grl.po_line_id = pol.id
          WHERE gr.purchase_order_id = po.id
        ), 0) THEN 'Matched'
        ELSE 'Variance'
      END as match_status
    FROM purchase_orders po
    JOIN vendors v ON po.vendor_id = v.id
    WHERE po.status NOT IN ('Draft', 'Cancelled')
    ORDER BY po.order_date DESC
    LIMIT 50
  `).all();
  res.json(matches);
});

// Summary stats
router.get('/summary', (req, res) => {
  const db = getDb();
  
  const poStats = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft,
      COUNT(CASE WHEN status IN ('Sent', 'Acknowledged') THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'Partial' THEN 1 END) as partial,
      COUNT(CASE WHEN status = 'Received' THEN 1 END) as received,
      COALESCE(SUM(CASE WHEN status NOT IN ('Closed', 'Cancelled', 'Received') THEN total_amount ELSE 0 END), 0) as open_value
    FROM purchase_orders
  `).get();

  const reqStats = db.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'Draft' THEN 1 END) as draft,
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
      COALESCE(SUM(CASE WHEN status = 'Pending' THEN total_amount ELSE 0 END), 0) as pending_value
    FROM purchase_requisitions
  `).get();

  const recentReceipts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM goods_receipts 
    WHERE receipt_date >= date('now', '-7 days')
  `).get() as { count: number };

  res.json({
    purchaseOrders: poStats,
    requisitions: reqStats,
    recentReceipts: recentReceipts.count
  });
});

export const p2pRoutes = router;
