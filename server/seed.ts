import { getDb, initDb } from './db.js';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Delete existing database
const dbPath = path.join(dataDir, 'erp.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Deleted existing database');
}

initDb();
const db = getDb();

console.log('Creating demo data for Nexus Manufacturing Co...\n');

// Company: Nexus Manufacturing Co. - Mid-size industrial equipment manufacturer

// ============ Chart of Accounts ============
const accounts: { id: string; account_number: string; name: string; type: string; sub_type: string; normal_balance: string; parent_id?: string }[] = [
  // Assets (1xxx)
  { id: uuid(), account_number: '1000', name: 'Assets', type: 'Asset', sub_type: 'Header', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1010', name: 'Cash - Operating', type: 'Asset', sub_type: 'Cash', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1020', name: 'Cash - Payroll', type: 'Asset', sub_type: 'Cash', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1100', name: 'Accounts Receivable', type: 'Asset', sub_type: 'Receivable', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1150', name: 'Allowance for Doubtful Accounts', type: 'Asset', sub_type: 'Contra', normal_balance: 'Credit' },
  { id: uuid(), account_number: '1200', name: 'Inventory - Raw Materials', type: 'Asset', sub_type: 'Inventory', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1210', name: 'Inventory - Work in Progress', type: 'Asset', sub_type: 'Inventory', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1220', name: 'Inventory - Finished Goods', type: 'Asset', sub_type: 'Inventory', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1300', name: 'Prepaid Expenses', type: 'Asset', sub_type: 'Prepaid', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1310', name: 'Prepaid Insurance', type: 'Asset', sub_type: 'Prepaid', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1500', name: 'Fixed Assets', type: 'Asset', sub_type: 'Header', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1510', name: 'Machinery & Equipment', type: 'Asset', sub_type: 'Fixed', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1520', name: 'Vehicles', type: 'Asset', sub_type: 'Fixed', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1530', name: 'Office Equipment', type: 'Asset', sub_type: 'Fixed', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1540', name: 'Building', type: 'Asset', sub_type: 'Fixed', normal_balance: 'Debit' },
  { id: uuid(), account_number: '1600', name: 'Accumulated Depreciation', type: 'Asset', sub_type: 'Contra', normal_balance: 'Credit' },

  // Liabilities (2xxx)
  { id: uuid(), account_number: '2000', name: 'Liabilities', type: 'Liability', sub_type: 'Header', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2010', name: 'Accounts Payable', type: 'Liability', sub_type: 'Payable', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2100', name: 'Accrued Expenses', type: 'Liability', sub_type: 'Accrued', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2110', name: 'Accrued Wages', type: 'Liability', sub_type: 'Accrued', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2120', name: 'Accrued Interest', type: 'Liability', sub_type: 'Accrued', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2200', name: 'Sales Tax Payable', type: 'Liability', sub_type: 'Tax', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2300', name: 'Current Portion - Long Term Debt', type: 'Liability', sub_type: 'Current', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2500', name: 'Long Term Debt', type: 'Liability', sub_type: 'LongTerm', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2510', name: 'Equipment Loan', type: 'Liability', sub_type: 'LongTerm', normal_balance: 'Credit' },
  { id: uuid(), account_number: '2520', name: 'Building Mortgage', type: 'Liability', sub_type: 'LongTerm', normal_balance: 'Credit' },

  // Equity (3xxx)
  { id: uuid(), account_number: '3000', name: 'Equity', type: 'Equity', sub_type: 'Header', normal_balance: 'Credit' },
  { id: uuid(), account_number: '3100', name: 'Common Stock', type: 'Equity', sub_type: 'Capital', normal_balance: 'Credit' },
  { id: uuid(), account_number: '3200', name: 'Retained Earnings', type: 'Equity', sub_type: 'Retained', normal_balance: 'Credit' },
  { id: uuid(), account_number: '3300', name: 'Current Year Earnings', type: 'Equity', sub_type: 'Current', normal_balance: 'Credit' },

  // Revenue (4xxx)
  { id: uuid(), account_number: '4000', name: 'Revenue', type: 'Revenue', sub_type: 'Header', normal_balance: 'Credit' },
  { id: uuid(), account_number: '4100', name: 'Product Sales', type: 'Revenue', sub_type: 'Sales', normal_balance: 'Credit' },
  { id: uuid(), account_number: '4200', name: 'Service Revenue', type: 'Revenue', sub_type: 'Service', normal_balance: 'Credit' },
  { id: uuid(), account_number: '4300', name: 'Installation Revenue', type: 'Revenue', sub_type: 'Service', normal_balance: 'Credit' },
  { id: uuid(), account_number: '4900', name: 'Other Income', type: 'Revenue', sub_type: 'Other', normal_balance: 'Credit' },

  // Expenses (5xxx - COGS, 6xxx - Operating)
  { id: uuid(), account_number: '5000', name: 'Cost of Goods Sold', type: 'Expense', sub_type: 'COGS', normal_balance: 'Debit' },
  { id: uuid(), account_number: '5100', name: 'Direct Materials', type: 'Expense', sub_type: 'COGS', normal_balance: 'Debit' },
  { id: uuid(), account_number: '5200', name: 'Direct Labor', type: 'Expense', sub_type: 'COGS', normal_balance: 'Debit' },
  { id: uuid(), account_number: '5300', name: 'Manufacturing Overhead', type: 'Expense', sub_type: 'COGS', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6000', name: 'Operating Expenses', type: 'Expense', sub_type: 'Header', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6100', name: 'Salaries & Wages', type: 'Expense', sub_type: 'Payroll', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6110', name: 'Employee Benefits', type: 'Expense', sub_type: 'Payroll', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6120', name: 'Payroll Taxes', type: 'Expense', sub_type: 'Payroll', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6200', name: 'Rent Expense', type: 'Expense', sub_type: 'Occupancy', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6210', name: 'Utilities', type: 'Expense', sub_type: 'Occupancy', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6220', name: 'Property Insurance', type: 'Expense', sub_type: 'Insurance', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6300', name: 'Office Supplies', type: 'Expense', sub_type: 'Operating', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6310', name: 'Postage & Shipping', type: 'Expense', sub_type: 'Operating', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6320', name: 'Telephone & Internet', type: 'Expense', sub_type: 'Operating', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6400', name: 'Professional Services', type: 'Expense', sub_type: 'Professional', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6410', name: 'Legal Fees', type: 'Expense', sub_type: 'Professional', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6420', name: 'Accounting Fees', type: 'Expense', sub_type: 'Professional', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6500', name: 'Advertising & Marketing', type: 'Expense', sub_type: 'Marketing', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6600', name: 'Travel & Entertainment', type: 'Expense', sub_type: 'T&E', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6700', name: 'Depreciation Expense', type: 'Expense', sub_type: 'NonCash', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6800', name: 'Bank Fees', type: 'Expense', sub_type: 'Other', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6900', name: 'Interest Expense', type: 'Expense', sub_type: 'Interest', normal_balance: 'Debit' },
  { id: uuid(), account_number: '6950', name: 'Miscellaneous Expense', type: 'Expense', sub_type: 'Other', normal_balance: 'Debit' },
];

const insertAccount = db.prepare(`
  INSERT INTO accounts (id, account_number, name, type, sub_type, normal_balance, parent_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const accountMap = new Map<string, string>();
for (const acc of accounts) {
  insertAccount.run(acc.id, acc.account_number, acc.name, acc.type, acc.sub_type, acc.normal_balance, acc.parent_id || null);
  accountMap.set(acc.account_number, acc.id);
}
console.log(`Created ${accounts.length} chart of accounts entries`);

// ============ Fiscal Periods ============
const periods = [
  { id: uuid(), name: '2024-Q3', start_date: '2024-07-01', end_date: '2024-09-30', status: 'Closed' },
  { id: uuid(), name: '2024-Q4', start_date: '2024-10-01', end_date: '2024-12-31', status: 'Open' },
  { id: uuid(), name: '2025-Q1', start_date: '2025-01-01', end_date: '2025-03-31', status: 'Open' },
];

const insertPeriod = db.prepare('INSERT INTO fiscal_periods (id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)');
for (const p of periods) {
  insertPeriod.run(p.id, p.name, p.start_date, p.end_date, p.status);
}
const currentPeriodId = periods[2].id;
console.log(`Created ${periods.length} fiscal periods`);

// ============ Vendors ============
const vendors = [
  { id: uuid(), vendor_number: 'V-001', name: 'Acme Steel Supply', contact_name: 'John Walker', email: 'orders@acmesteel.com', phone: '555-0101', address: '123 Industrial Way', city: 'Detroit', state: 'MI', zip: '48201', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-002', name: 'Precision Components Inc', contact_name: 'Sarah Chen', email: 'sales@precisioncomp.com', phone: '555-0102', address: '456 Tech Park Blvd', city: 'Chicago', state: 'IL', zip: '60601', payment_terms: 'Net 45' },
  { id: uuid(), vendor_number: 'V-003', name: 'Eastern Electric Co', contact_name: 'Mike Johnson', email: 'mike@easternelectric.com', phone: '555-0103', address: '789 Power Lane', city: 'Cleveland', state: 'OH', zip: '44101', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-004', name: 'Global Fasteners Ltd', contact_name: 'Lisa Park', email: 'orders@globalfast.com', phone: '555-0104', address: '321 Hardware Ave', city: 'Indianapolis', state: 'IN', zip: '46201', payment_terms: '2/10 Net 30' },
  { id: uuid(), vendor_number: 'V-005', name: 'Premium Packaging Solutions', contact_name: 'Tom Davis', email: 'tom@premiumpack.com', phone: '555-0105', address: '654 Box Street', city: 'Columbus', state: 'OH', zip: '43201', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-006', name: 'Industrial Lubricants Corp', contact_name: 'Nancy White', email: 'sales@indlubricants.com', phone: '555-0106', address: '987 Oil Road', city: 'Toledo', state: 'OH', zip: '43601', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-007', name: 'Metro Office Supplies', contact_name: 'Bob Smith', email: 'orders@metrooffice.com', phone: '555-0107', address: '147 Commerce St', city: 'Detroit', state: 'MI', zip: '48226', payment_terms: 'Net 15' },
  { id: uuid(), vendor_number: 'V-008', name: 'Midwest Safety Equipment', contact_name: 'Karen Brown', email: 'karen@mwsafety.com', phone: '555-0108', address: '258 Safety Lane', city: 'Grand Rapids', state: 'MI', zip: '49501', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-009', name: 'TechParts Distributors', contact_name: 'Steve Miller', email: 'steve@techparts.com', phone: '555-0109', address: '369 Component Way', city: 'Ann Arbor', state: 'MI', zip: '48103', payment_terms: 'Net 45' },
  { id: uuid(), vendor_number: 'V-010', name: 'Quality Bearings Inc', contact_name: 'Diana Ross', email: 'orders@qbearings.com', phone: '555-0110', address: '741 Roller Road', city: 'Akron', state: 'OH', zip: '44301', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-011', name: 'Reliable Shipping Co', contact_name: 'James Wilson', email: 'dispatch@reliableship.com', phone: '555-0111', address: '852 Freight Blvd', city: 'Toledo', state: 'OH', zip: '43604', payment_terms: 'Net 15' },
  { id: uuid(), vendor_number: 'V-012', name: 'Apex Tool & Die', contact_name: 'Robert Taylor', email: 'info@apextool.com', phone: '555-0112', address: '963 Machinist Ave', city: 'Lansing', state: 'MI', zip: '48901', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-013', name: 'Great Lakes Power Systems', contact_name: 'Patricia Martinez', email: 'sales@glpower.com', phone: '555-0113', address: '159 Energy Drive', city: 'Detroit', state: 'MI', zip: '48207', payment_terms: 'Net 45' },
  { id: uuid(), vendor_number: 'V-014', name: 'Consolidated Chemicals', contact_name: 'Mark Anderson', email: 'orders@conchemical.com', phone: '555-0114', address: '357 Chemical Lane', city: 'Cleveland', state: 'OH', zip: '44115', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-015', name: 'American Wire & Cable', contact_name: 'Jennifer Thomas', email: 'sales@amwire.com', phone: '555-0115', address: '486 Wire Way', city: 'Pittsburgh', state: 'PA', zip: '15201', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-016', name: 'Superior Welding Supplies', contact_name: 'Michael Garcia', email: 'orders@supweld.com', phone: '555-0116', address: '624 Welder Rd', city: 'Gary', state: 'IN', zip: '46401', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-017', name: 'Henderson HVAC Services', contact_name: 'William Lee', email: 'service@hendersonhvac.com', phone: '555-0117', address: '753 Climate Ct', city: 'Detroit', state: 'MI', zip: '48210', payment_terms: 'Due on Receipt' },
  { id: uuid(), vendor_number: 'V-018', name: 'Lakefront IT Solutions', contact_name: 'Elizabeth Clark', email: 'support@lakefrontit.com', phone: '555-0118', address: '861 Tech Center Dr', city: 'Detroit', state: 'MI', zip: '48243', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-019', name: 'Midwest Janitorial Supply', contact_name: 'David Lewis', email: 'orders@mwjanitor.com', phone: '555-0119', address: '972 Clean Street', city: 'Flint', state: 'MI', zip: '48501', payment_terms: 'Net 30' },
  { id: uuid(), vendor_number: 'V-020', name: 'National Insurance Corp', contact_name: 'Michelle Robinson', email: 'claims@nationalins.com', phone: '555-0120', address: '183 Coverage Ave', city: 'Chicago', state: 'IL', zip: '60602', payment_terms: 'Due on Receipt' },
];

const insertVendor = db.prepare(`
  INSERT INTO vendors (id, vendor_number, name, contact_name, email, phone, address, city, state, zip, payment_terms)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const vendorMap = new Map<string, string>();
for (const v of vendors) {
  insertVendor.run(v.id, v.vendor_number, v.name, v.contact_name, v.email, v.phone, v.address, v.city, v.state, v.zip, v.payment_terms);
  vendorMap.set(v.vendor_number, v.id);
}
console.log(`Created ${vendors.length} vendors`);

// ============ Customers ============
const customers = [
  { id: uuid(), customer_number: 'C-001', name: 'Automotive Excellence Corp', contact_name: 'Richard Harris', email: 'purchasing@autoexcellence.com', phone: '555-1001', address: '1000 Motor Parkway', city: 'Detroit', state: 'MI', zip: '48202', payment_terms: 'Net 30', credit_limit: 250000 },
  { id: uuid(), customer_number: 'C-002', name: 'Midwest Manufacturing LLC', contact_name: 'Sandra Wright', email: 'orders@mwmanufacturing.com', phone: '555-1002', address: '2000 Factory Lane', city: 'Chicago', state: 'IL', zip: '60610', payment_terms: 'Net 45', credit_limit: 175000 },
  { id: uuid(), customer_number: 'C-003', name: 'Great Lakes Assembly', contact_name: 'James Cooper', email: 'procurement@glassembly.com', phone: '555-1003', address: '3000 Production Way', city: 'Cleveland', state: 'OH', zip: '44102', payment_terms: 'Net 30', credit_limit: 200000 },
  { id: uuid(), customer_number: 'C-004', name: 'Premier Industrial Solutions', contact_name: 'Margaret Adams', email: 'buying@premierind.com', phone: '555-1004', address: '4000 Industry Drive', city: 'Indianapolis', state: 'IN', zip: '46202', payment_terms: 'Net 30', credit_limit: 150000 },
  { id: uuid(), customer_number: 'C-005', name: 'Northern Steel Works', contact_name: 'Charles Baker', email: 'purchasing@northernsteel.com', phone: '555-1005', address: '5000 Steel Avenue', city: 'Pittsburgh', state: 'PA', zip: '15202', payment_terms: 'Net 45', credit_limit: 300000 },
  { id: uuid(), customer_number: 'C-006', name: 'Valley Equipment Co', contact_name: 'Patricia Nelson', email: 'orders@valleyequip.com', phone: '555-1006', address: '6000 Equipment Road', city: 'Columbus', state: 'OH', zip: '43202', payment_terms: 'Net 30', credit_limit: 125000 },
  { id: uuid(), customer_number: 'C-007', name: 'Custom Fabrication Inc', contact_name: 'Robert King', email: 'procurement@customfab.com', phone: '555-1007', address: '7000 Fabrication Blvd', city: 'Grand Rapids', state: 'MI', zip: '49502', payment_terms: 'Net 30', credit_limit: 100000 },
  { id: uuid(), customer_number: 'C-008', name: 'Atlas Machinery Corp', contact_name: 'Jennifer Scott', email: 'buying@atlasmachinery.com', phone: '555-1008', address: '8000 Machine Circle', city: 'Milwaukee', state: 'WI', zip: '53201', payment_terms: 'Net 30', credit_limit: 175000 },
  { id: uuid(), customer_number: 'C-009', name: 'Empire Tool & Machine', contact_name: 'William Green', email: 'orders@empiretool.com', phone: '555-1009', address: '9000 Tool Parkway', city: 'Buffalo', state: 'NY', zip: '14201', payment_terms: 'Net 45', credit_limit: 200000 },
  { id: uuid(), customer_number: 'C-010', name: 'Central States Foundry', contact_name: 'Linda Hall', email: 'procurement@csfoundry.com', phone: '555-1010', address: '1100 Foundry Lane', city: 'St. Louis', state: 'MO', zip: '63101', payment_terms: 'Net 30', credit_limit: 225000 },
  { id: uuid(), customer_number: 'C-011', name: 'Heartland Heavy Industries', contact_name: 'David Allen', email: 'purchasing@heartlandheavy.com', phone: '555-1011', address: '1200 Heavy Equipment Rd', city: 'Kansas City', state: 'MO', zip: '64101', payment_terms: 'Net 30', credit_limit: 250000 },
  { id: uuid(), customer_number: 'C-012', name: 'Precision Dynamics Ltd', contact_name: 'Mary Young', email: 'orders@precisiondynamics.com', phone: '555-1012', address: '1300 Precision Drive', city: 'Cincinnati', state: 'OH', zip: '45201', payment_terms: 'Net 30', credit_limit: 150000 },
  { id: uuid(), customer_number: 'C-013', name: 'Lakeshore Manufacturing', contact_name: 'Thomas Hernandez', email: 'buying@lakeshoremfg.com', phone: '555-1013', address: '1400 Lakeshore Blvd', city: 'Erie', state: 'PA', zip: '16501', payment_terms: 'Net 45', credit_limit: 125000 },
  { id: uuid(), customer_number: 'C-014', name: 'Summit Industrial Group', contact_name: 'Barbara Lopez', email: 'procurement@summitindustrial.com', phone: '555-1014', address: '1500 Summit Ave', city: 'Akron', state: 'OH', zip: '44302', payment_terms: 'Net 30', credit_limit: 175000 },
  { id: uuid(), customer_number: 'C-015', name: 'Titan Metalworks', contact_name: 'Joseph Martinez', email: 'purchasing@titanmetal.com', phone: '555-1015', address: '1600 Titan Road', city: 'Toledo', state: 'OH', zip: '43602', payment_terms: 'Net 30', credit_limit: 200000 },
];

const insertCustomer = db.prepare(`
  INSERT INTO customers (id, customer_number, name, contact_name, email, phone, address, city, state, zip, payment_terms, credit_limit)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const customerMap = new Map<string, string>();
for (const c of customers) {
  insertCustomer.run(c.id, c.customer_number, c.name, c.contact_name, c.email, c.phone, c.address, c.city, c.state, c.zip, c.payment_terms, c.credit_limit);
  customerMap.set(c.customer_number, c.id);
}
console.log(`Created ${customers.length} customers`);

// ============ Journal Entries ============
const insertJE = db.prepare(`
  INSERT INTO journal_entries (id, entry_number, entry_date, period_id, description, reference, source, status, total_debit, total_credit, created_by, posted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertJELine = db.prepare(`
  INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit, description, line_number)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let jeNumber = 1000;
const journalEntries: { id: string; number: string; date: string; desc: string }[] = [];

function createJE(date: string, description: string, lines: { account: string; debit: number; credit: number; desc?: string }[], source = 'Manual', reference?: string) {
  const id = uuid();
  const entryNumber = `JE-${++jeNumber}`;
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  
  insertJE.run(id, entryNumber, date, currentPeriodId, description, reference || null, source, 'Posted', totalDebit, totalCredit, 'system', date);
  
  lines.forEach((line, idx) => {
    insertJELine.run(uuid(), id, accountMap.get(line.account), line.debit, line.credit, line.desc || description, idx + 1);
  });
  
  journalEntries.push({ id, number: entryNumber, date, desc: description });
  return id;
}

// Opening balances (simulate start of period)
createJE('2025-01-01', 'Opening Balance - Cash', [
  { account: '1010', debit: 485000, credit: 0, desc: 'Cash - Operating' },
  { account: '3200', debit: 0, credit: 485000, desc: 'Retained Earnings' }
]);

createJE('2025-01-01', 'Opening Balance - Receivables', [
  { account: '1100', debit: 325000, credit: 0, desc: 'Accounts Receivable' },
  { account: '3200', debit: 0, credit: 325000, desc: 'Retained Earnings' }
]);

createJE('2025-01-01', 'Opening Balance - Inventory', [
  { account: '1200', debit: 175000, credit: 0, desc: 'Raw Materials' },
  { account: '1220', debit: 245000, credit: 0, desc: 'Finished Goods' },
  { account: '3200', debit: 0, credit: 420000, desc: 'Retained Earnings' }
]);

createJE('2025-01-01', 'Opening Balance - Fixed Assets', [
  { account: '1510', debit: 850000, credit: 0, desc: 'Machinery & Equipment' },
  { account: '1540', debit: 1200000, credit: 0, desc: 'Building' },
  { account: '1600', debit: 0, credit: 425000, desc: 'Accumulated Depreciation' },
  { account: '3200', debit: 0, credit: 1625000, desc: 'Retained Earnings' }
]);

createJE('2025-01-01', 'Opening Balance - Liabilities', [
  { account: '3200', debit: 725000, credit: 0, desc: 'Retained Earnings' },
  { account: '2010', debit: 0, credit: 185000, desc: 'Accounts Payable' },
  { account: '2520', debit: 0, credit: 540000, desc: 'Building Mortgage' }
]);

// January 2025 transactions
createJE('2025-01-03', 'Product sales - Automotive Excellence Corp', [
  { account: '1100', debit: 47500, credit: 0, desc: 'AR - Automotive Excellence' },
  { account: '4100', debit: 0, credit: 47500, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-001');

createJE('2025-01-05', 'Raw materials purchase - Acme Steel', [
  { account: '1200', debit: 28750, credit: 0, desc: 'Raw Materials Inventory' },
  { account: '2010', debit: 0, credit: 28750, desc: 'AP - Acme Steel' }
], 'AP Invoice', 'ACME-5821');

createJE('2025-01-08', 'Payroll - Week 1', [
  { account: '6100', debit: 45000, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3442, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 48442, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-01-10', 'Product sales - Midwest Manufacturing', [
  { account: '1100', debit: 62300, credit: 0, desc: 'AR - Midwest Manufacturing' },
  { account: '4100', debit: 0, credit: 62300, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-002');

createJE('2025-01-12', 'Components purchase - Precision Components', [
  { account: '1200', debit: 34200, credit: 0, desc: 'Raw Materials Inventory' },
  { account: '2010', debit: 0, credit: 34200, desc: 'AP - Precision Components' }
], 'AP Invoice', 'PC-78234');

createJE('2025-01-15', 'Utilities payment', [
  { account: '6210', debit: 4850, credit: 0, desc: 'Utilities' },
  { account: '1010', debit: 0, credit: 4850, desc: 'Cash' }
], 'AP Payment', 'CHK-10234');

createJE('2025-01-15', 'Payroll - Week 2', [
  { account: '6100', debit: 45000, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3442, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 48442, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-01-17', 'Service revenue - Great Lakes Assembly', [
  { account: '1100', debit: 18500, credit: 0, desc: 'AR - Great Lakes Assembly' },
  { account: '4200', debit: 0, credit: 18500, desc: 'Service Revenue' }
], 'AR Invoice', 'INV-2025-003');

createJE('2025-01-18', 'Office supplies purchase', [
  { account: '6300', debit: 2340, credit: 0, desc: 'Office Supplies' },
  { account: '2010', debit: 0, credit: 2340, desc: 'AP - Metro Office' }
], 'AP Invoice', 'MO-4521');

createJE('2025-01-20', 'Customer payment received - Automotive Excellence', [
  { account: '1010', debit: 47500, credit: 0, desc: 'Cash received' },
  { account: '1100', debit: 0, credit: 47500, desc: 'AR - Automotive Excellence' }
], 'AR Payment', 'DEP-0120');

createJE('2025-01-22', 'Product sales - Premier Industrial', [
  { account: '1100', debit: 38750, credit: 0, desc: 'AR - Premier Industrial' },
  { account: '4100', debit: 0, credit: 38750, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-004');

createJE('2025-01-22', 'Payroll - Week 3', [
  { account: '6100', debit: 45000, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3442, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 48442, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-01-23', 'Vendor payment - Acme Steel', [
  { account: '2010', debit: 28750, credit: 0, desc: 'AP - Acme Steel' },
  { account: '1010', debit: 0, credit: 28750, desc: 'Cash - Operating' }
], 'AP Payment', 'CHK-10235');

createJE('2025-01-25', 'Safety equipment purchase', [
  { account: '6300', debit: 3875, credit: 0, desc: 'Safety Equipment' },
  { account: '2010', debit: 0, credit: 3875, desc: 'AP - Midwest Safety' }
], 'AP Invoice', 'MWS-2234');

createJE('2025-01-25', 'Product sales - Northern Steel Works', [
  { account: '1100', debit: 87500, credit: 0, desc: 'AR - Northern Steel Works' },
  { account: '4100', debit: 0, credit: 87500, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-005');

createJE('2025-01-27', 'Installation revenue - Atlas Machinery', [
  { account: '1100', debit: 12500, credit: 0, desc: 'AR - Atlas Machinery' },
  { account: '4300', debit: 0, credit: 12500, desc: 'Installation Revenue' }
], 'AR Invoice', 'INV-2025-006');

createJE('2025-01-28', 'Rent payment - January', [
  { account: '6200', debit: 15000, credit: 0, desc: 'Rent Expense' },
  { account: '1010', debit: 0, credit: 15000, desc: 'Cash' }
], 'AP Payment', 'CHK-10236');

createJE('2025-01-29', 'Payroll - Week 4', [
  { account: '6100', debit: 45000, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3442, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 48442, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-01-30', 'Electric motor purchase - Eastern Electric', [
  { account: '1200', debit: 22400, credit: 0, desc: 'Raw Materials' },
  { account: '2010', debit: 0, credit: 22400, desc: 'AP - Eastern Electric' }
], 'AP Invoice', 'EE-9912');

createJE('2025-01-30', 'Customer payment - Midwest Manufacturing', [
  { account: '1010', debit: 62300, credit: 0, desc: 'Cash received' },
  { account: '1100', debit: 0, credit: 62300, desc: 'AR - Midwest Mfg' }
], 'AR Payment', 'DEP-0130');

createJE('2025-01-31', 'Monthly depreciation', [
  { account: '6700', debit: 8500, credit: 0, desc: 'Depreciation Expense' },
  { account: '1600', debit: 0, credit: 8500, desc: 'Accumulated Depreciation' }
], 'Adjusting');

createJE('2025-01-31', 'Cost of goods sold - January', [
  { account: '5100', debit: 142500, credit: 0, desc: 'Direct Materials' },
  { account: '5200', debit: 85000, credit: 0, desc: 'Direct Labor' },
  { account: '5300', debit: 28500, credit: 0, desc: 'Manufacturing Overhead' },
  { account: '1200', debit: 0, credit: 142500, desc: 'Raw Materials' },
  { account: '2110', debit: 0, credit: 85000, desc: 'Accrued Wages' },
  { account: '1010', debit: 0, credit: 28500, desc: 'Cash' }
], 'Month-End');

// February 2025 transactions
createJE('2025-02-03', 'Product sales - Empire Tool & Machine', [
  { account: '1100', debit: 55800, credit: 0, desc: 'AR - Empire Tool' },
  { account: '4100', debit: 0, credit: 55800, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-007');

createJE('2025-02-05', 'Fasteners purchase - Global Fasteners', [
  { account: '1200', debit: 8950, credit: 0, desc: 'Raw Materials' },
  { account: '2010', debit: 0, credit: 8950, desc: 'AP - Global Fasteners' }
], 'AP Invoice', 'GF-33421');

createJE('2025-02-06', 'Product sales - Central States Foundry', [
  { account: '1100', debit: 72400, credit: 0, desc: 'AR - Central States' },
  { account: '4100', debit: 0, credit: 72400, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-008');

createJE('2025-02-07', 'Payroll - Week 5', [
  { account: '6100', debit: 46500, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3557, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 50057, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-02-08', 'Vendor payment - Precision Components', [
  { account: '2010', debit: 34200, credit: 0, desc: 'AP - Precision Components' },
  { account: '1010', debit: 0, credit: 34200, desc: 'Cash' }
], 'AP Payment', 'CHK-10237');

createJE('2025-02-10', 'Product sales - Heartland Heavy', [
  { account: '1100', debit: 94500, credit: 0, desc: 'AR - Heartland Heavy' },
  { account: '4100', debit: 0, credit: 94500, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-009');

createJE('2025-02-12', 'Wire purchase - American Wire & Cable', [
  { account: '1200', debit: 15800, credit: 0, desc: 'Raw Materials' },
  { account: '2010', debit: 0, credit: 15800, desc: 'AP - American Wire' }
], 'AP Invoice', 'AWC-67123');

createJE('2025-02-14', 'Payroll - Week 6', [
  { account: '6100', debit: 46500, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3557, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 50057, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-02-15', 'Utilities payment', [
  { account: '6210', debit: 5120, credit: 0, desc: 'Utilities' },
  { account: '1010', debit: 0, credit: 5120, desc: 'Cash' }
], 'AP Payment', 'CHK-10238');

createJE('2025-02-17', 'Customer payment - Great Lakes Assembly', [
  { account: '1010', debit: 18500, credit: 0, desc: 'Cash received' },
  { account: '1100', debit: 0, credit: 18500, desc: 'AR - Great Lakes' }
], 'AR Payment', 'DEP-0217');

createJE('2025-02-18', 'Service revenue - Precision Dynamics', [
  { account: '1100', debit: 24800, credit: 0, desc: 'AR - Precision Dynamics' },
  { account: '4200', debit: 0, credit: 24800, desc: 'Service Revenue' }
], 'AR Invoice', 'INV-2025-010');

createJE('2025-02-20', 'Bearings purchase - Quality Bearings', [
  { account: '1200', debit: 11250, credit: 0, desc: 'Raw Materials' },
  { account: '2010', debit: 0, credit: 11250, desc: 'AP - Quality Bearings' }
], 'AP Invoice', 'QB-8823');

createJE('2025-02-21', 'Payroll - Week 7', [
  { account: '6100', debit: 46500, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3557, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 50057, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-02-22', 'Product sales - Titan Metalworks', [
  { account: '1100', debit: 41200, credit: 0, desc: 'AR - Titan Metalworks' },
  { account: '4100', debit: 0, credit: 41200, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-011');

createJE('2025-02-24', 'Customer payment - Premier Industrial', [
  { account: '1010', debit: 38750, credit: 0, desc: 'Cash received' },
  { account: '1100', debit: 0, credit: 38750, desc: 'AR - Premier Industrial' }
], 'AR Payment', 'DEP-0224');

createJE('2025-02-25', 'Rent payment - February', [
  { account: '6200', debit: 15000, credit: 0, desc: 'Rent Expense' },
  { account: '1010', debit: 0, credit: 15000, desc: 'Cash' }
], 'AP Payment', 'CHK-10239');

createJE('2025-02-26', 'Product sales - Custom Fabrication', [
  { account: '1100', debit: 28900, credit: 0, desc: 'AR - Custom Fabrication' },
  { account: '4100', debit: 0, credit: 28900, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-012');

createJE('2025-02-27', 'Lubricants purchase - Industrial Lubricants', [
  { account: '5300', debit: 4750, credit: 0, desc: 'Manufacturing Overhead' },
  { account: '2010', debit: 0, credit: 4750, desc: 'AP - Industrial Lubricants' }
], 'AP Invoice', 'IL-5567');

createJE('2025-02-28', 'Payroll - Week 8', [
  { account: '6100', debit: 46500, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3557, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 50057, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-02-28', 'Monthly depreciation', [
  { account: '6700', debit: 8500, credit: 0, desc: 'Depreciation Expense' },
  { account: '1600', debit: 0, credit: 8500, desc: 'Accumulated Depreciation' }
], 'Adjusting');

createJE('2025-02-28', 'Cost of goods sold - February', [
  { account: '5100', debit: 158000, credit: 0, desc: 'Direct Materials' },
  { account: '5200', debit: 92000, credit: 0, desc: 'Direct Labor' },
  { account: '5300', debit: 31500, credit: 0, desc: 'Manufacturing Overhead' },
  { account: '1200', debit: 0, credit: 158000, desc: 'Raw Materials' },
  { account: '2110', debit: 0, credit: 92000, desc: 'Accrued Wages' },
  { account: '1010', debit: 0, credit: 31500, desc: 'Cash' }
], 'Month-End');

// More Q1 transactions for March
createJE('2025-03-03', 'Product sales - Valley Equipment', [
  { account: '1100', debit: 36500, credit: 0, desc: 'AR - Valley Equipment' },
  { account: '4100', debit: 0, credit: 36500, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-013');

createJE('2025-03-05', 'Steel purchase - Acme Steel', [
  { account: '1200', debit: 32100, credit: 0, desc: 'Raw Materials' },
  { account: '2010', debit: 0, credit: 32100, desc: 'AP - Acme Steel' }
], 'AP Invoice', 'ACME-6024');

createJE('2025-03-07', 'Payroll - Week 9', [
  { account: '6100', debit: 47000, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3595, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 50595, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-03-10', 'Customer payment - Northern Steel Works', [
  { account: '1010', debit: 87500, credit: 0, desc: 'Cash received' },
  { account: '1100', debit: 0, credit: 87500, desc: 'AR - Northern Steel' }
], 'AR Payment', 'DEP-0310');

createJE('2025-03-12', 'Product sales - Lakeshore Manufacturing', [
  { account: '1100', debit: 48750, credit: 0, desc: 'AR - Lakeshore Mfg' },
  { account: '4100', debit: 0, credit: 48750, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-014');

createJE('2025-03-14', 'Payroll - Week 10', [
  { account: '6100', debit: 47000, credit: 0, desc: 'Salaries & Wages' },
  { account: '6120', debit: 3595, credit: 0, desc: 'Payroll Taxes' },
  { account: '1010', debit: 0, credit: 50595, desc: 'Cash - Operating' }
], 'Payroll');

createJE('2025-03-15', 'Utilities payment', [
  { account: '6210', debit: 4980, credit: 0, desc: 'Utilities' },
  { account: '1010', debit: 0, credit: 4980, desc: 'Cash' }
], 'AP Payment', 'CHK-10240');

createJE('2025-03-17', 'Vendor payment - Eastern Electric', [
  { account: '2010', debit: 22400, credit: 0, desc: 'AP - Eastern Electric' },
  { account: '1010', debit: 0, credit: 22400, desc: 'Cash' }
], 'AP Payment', 'CHK-10241');

createJE('2025-03-18', 'Product sales - Summit Industrial', [
  { account: '1100', debit: 67300, credit: 0, desc: 'AR - Summit Industrial' },
  { account: '4100', debit: 0, credit: 67300, desc: 'Product Sales' }
], 'AR Invoice', 'INV-2025-015');

createJE('2025-03-20', 'Welding supplies - Superior Welding', [
  { account: '5300', debit: 6800, credit: 0, desc: 'Manufacturing Overhead' },
  { account: '2010', debit: 0, credit: 6800, desc: 'AP - Superior Welding' }
], 'AP Invoice', 'SW-1123');

console.log(`Created ${journalEntries.length} journal entries`);

// ============ AP Invoices ============
const insertAPInvoice = db.prepare(`
  INSERT INTO ap_invoices (id, invoice_number, vendor_id, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, balance_due, status, description, gl_account_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const apInvoices = [
  // Unpaid invoices (various aging)
  { invoice_number: 'ACME-6024', vendor: 'V-001', invoice_date: '2025-03-05', due_date: '2025-04-04', amount: 32100, status: 'Open', desc: 'Steel materials order', account: '1200' },
  { invoice_number: 'SW-1123', vendor: 'V-016', invoice_date: '2025-03-20', due_date: '2025-04-19', amount: 6800, status: 'Open', desc: 'Welding supplies', account: '5300' },
  { invoice_number: 'QB-8823', vendor: 'V-010', invoice_date: '2025-02-20', due_date: '2025-03-22', amount: 11250, status: 'Overdue', desc: 'Industrial bearings', account: '1200' },
  { invoice_number: 'AWC-67123', vendor: 'V-015', invoice_date: '2025-02-12', due_date: '2025-03-14', amount: 15800, status: 'Overdue', desc: 'Electrical wire & cable', account: '1200' },
  { invoice_number: 'IL-5567', vendor: 'V-006', invoice_date: '2025-02-27', due_date: '2025-03-29', amount: 4750, status: 'Open', desc: 'Industrial lubricants', account: '5300' },
  { invoice_number: 'GF-33421', vendor: 'V-004', invoice_date: '2025-02-05', due_date: '2025-03-07', amount: 8950, status: 'Overdue', desc: 'Fasteners and hardware', account: '1200' },
  { invoice_number: 'MWS-2234', vendor: 'V-008', invoice_date: '2025-01-25', due_date: '2025-02-24', amount: 3875, status: 'Overdue', desc: 'Safety equipment', account: '6300' },
  { invoice_number: 'MO-4521', vendor: 'V-007', invoice_date: '2025-01-18', due_date: '2025-02-02', amount: 2340, status: 'Overdue', desc: 'Office supplies', account: '6300' },
  { invoice_number: 'TP-4412', vendor: 'V-009', invoice_date: '2025-03-01', due_date: '2025-04-15', amount: 18500, status: 'Open', desc: 'Electronic components', account: '1200' },
  { invoice_number: 'ATP-8832', vendor: 'V-012', invoice_date: '2025-03-08', due_date: '2025-04-07', amount: 24300, status: 'Open', desc: 'Custom tooling', account: '1510' },
  { invoice_number: 'GLP-2291', vendor: 'V-013', invoice_date: '2025-03-10', due_date: '2025-04-24', amount: 15600, status: 'Open', desc: 'Power system components', account: '1200' },
  { invoice_number: 'CC-8821', vendor: 'V-014', invoice_date: '2025-03-12', due_date: '2025-04-11', amount: 7200, status: 'Open', desc: 'Chemical supplies', account: '5300' },
  { invoice_number: 'RS-3345', vendor: 'V-011', invoice_date: '2025-03-15', due_date: '2025-03-30', amount: 4250, status: 'Open', desc: 'Freight charges', account: '6310' },
  { invoice_number: 'HH-2234', vendor: 'V-017', invoice_date: '2025-03-18', due_date: '2025-03-18', amount: 2850, status: 'Overdue', desc: 'HVAC repair service', account: '6950' },
  { invoice_number: 'LIT-9912', vendor: 'V-018', invoice_date: '2025-02-01', due_date: '2025-03-03', amount: 8500, status: 'Overdue', desc: 'IT support - February', account: '6400' },
  { invoice_number: 'MJ-5521', vendor: 'V-019', invoice_date: '2025-03-01', due_date: '2025-03-31', amount: 1850, status: 'Open', desc: 'Janitorial supplies', account: '6300' },
  { invoice_number: 'NIC-Q1', vendor: 'V-020', invoice_date: '2025-01-01', due_date: '2025-01-01', amount: 42500, status: 'Paid', desc: 'Q1 insurance premium', account: '6220' },
  { invoice_number: 'PP-7234', vendor: 'V-005', invoice_date: '2025-02-15', due_date: '2025-03-17', amount: 5600, status: 'Overdue', desc: 'Packaging materials', account: '5300' },
];

for (const inv of apInvoices) {
  const amountPaid = inv.status === 'Paid' ? inv.amount : 0;
  insertAPInvoice.run(
    uuid(), inv.invoice_number, vendorMap.get(inv.vendor), inv.invoice_date, inv.due_date,
    inv.amount, 0, inv.amount, amountPaid, inv.amount - amountPaid, inv.status, inv.desc, accountMap.get(inv.account)
  );
}
console.log(`Created ${apInvoices.length} AP invoices`);

// ============ AR Invoices ============
const insertARInvoice = db.prepare(`
  INSERT INTO ar_invoices (id, invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, balance_due, status, description, gl_account_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const arInvoices = [
  { invoice_number: 'INV-2025-001', customer: 'C-001', invoice_date: '2025-01-03', due_date: '2025-02-02', amount: 47500, status: 'Paid', desc: 'Industrial equipment order #1205' },
  { invoice_number: 'INV-2025-002', customer: 'C-002', invoice_date: '2025-01-10', due_date: '2025-02-24', amount: 62300, status: 'Paid', desc: 'Manufacturing components' },
  { invoice_number: 'INV-2025-003', customer: 'C-003', invoice_date: '2025-01-17', due_date: '2025-02-16', amount: 18500, status: 'Paid', desc: 'Equipment servicing' },
  { invoice_number: 'INV-2025-004', customer: 'C-004', invoice_date: '2025-01-22', due_date: '2025-02-21', amount: 38750, status: 'Paid', desc: 'Assembly line components' },
  { invoice_number: 'INV-2025-005', customer: 'C-005', invoice_date: '2025-01-25', due_date: '2025-03-11', amount: 87500, status: 'Paid', desc: 'Heavy machinery parts' },
  { invoice_number: 'INV-2025-006', customer: 'C-008', invoice_date: '2025-01-27', due_date: '2025-02-26', amount: 12500, status: 'Overdue', desc: 'Installation services' },
  { invoice_number: 'INV-2025-007', customer: 'C-009', invoice_date: '2025-02-03', due_date: '2025-03-20', amount: 55800, status: 'Open', desc: 'Precision tooling equipment' },
  { invoice_number: 'INV-2025-008', customer: 'C-010', invoice_date: '2025-02-06', due_date: '2025-03-08', amount: 72400, status: 'Overdue', desc: 'Foundry equipment' },
  { invoice_number: 'INV-2025-009', customer: 'C-011', invoice_date: '2025-02-10', due_date: '2025-03-12', amount: 94500, status: 'Overdue', desc: 'Heavy equipment modules' },
  { invoice_number: 'INV-2025-010', customer: 'C-012', invoice_date: '2025-02-18', due_date: '2025-03-20', amount: 24800, status: 'Open', desc: 'Consulting and service' },
  { invoice_number: 'INV-2025-011', customer: 'C-015', invoice_date: '2025-02-22', due_date: '2025-03-24', amount: 41200, status: 'Open', desc: 'Metal fabrication parts' },
  { invoice_number: 'INV-2025-012', customer: 'C-007', invoice_date: '2025-02-26', due_date: '2025-03-28', amount: 28900, status: 'Open', desc: 'Custom components' },
  { invoice_number: 'INV-2025-013', customer: 'C-006', invoice_date: '2025-03-03', due_date: '2025-04-02', amount: 36500, status: 'Open', desc: 'Equipment parts' },
  { invoice_number: 'INV-2025-014', customer: 'C-013', invoice_date: '2025-03-12', due_date: '2025-04-26', amount: 48750, status: 'Open', desc: 'Manufacturing equipment' },
  { invoice_number: 'INV-2025-015', customer: 'C-014', invoice_date: '2025-03-18', due_date: '2025-04-17', amount: 67300, status: 'Open', desc: 'Industrial components order' },
];

for (const inv of arInvoices) {
  const amountPaid = inv.status === 'Paid' ? inv.amount : 0;
  insertARInvoice.run(
    uuid(), inv.invoice_number, customerMap.get(inv.customer), inv.invoice_date, inv.due_date,
    inv.amount, 0, inv.amount, amountPaid, inv.amount - amountPaid, inv.status, inv.desc, accountMap.get('4100')
  );
}
console.log(`Created ${arInvoices.length} AR invoices`);

// ============ Purchase Orders ============
const insertPO = db.prepare(`
  INSERT INTO purchase_orders (id, po_number, vendor_id, order_date, expected_date, status, subtotal, tax_amount, total_amount, shipping_address, notes, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertPOLine = db.prepare(`
  INSERT INTO purchase_order_lines (id, purchase_order_id, line_number, description, quantity, unit_price, total_price, quantity_received, gl_account_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const purchaseOrders = [
  { po_number: 'PO-2025-001', vendor: 'V-001', order_date: '2025-03-01', expected_date: '2025-03-15', status: 'Received', total: 45000, lines: [
    { desc: 'Steel sheet 4x8 (gauge 16)', qty: 100, price: 250, received: 100 },
    { desc: 'Steel rod 1" diameter (10ft)', qty: 50, price: 180, received: 50 },
    { desc: 'Steel tube 2x2 (20ft)', qty: 75, price: 200, received: 75 },
  ]},
  { po_number: 'PO-2025-002', vendor: 'V-002', order_date: '2025-03-05', expected_date: '2025-03-20', status: 'Partial', total: 28500, lines: [
    { desc: 'Precision bearings (set of 4)', qty: 50, price: 320, received: 30 },
    { desc: 'Drive shafts - custom', qty: 25, price: 480, received: 25 },
    { desc: 'Coupling assemblies', qty: 40, price: 125, received: 20 },
  ]},
  { po_number: 'PO-2025-003', vendor: 'V-003', order_date: '2025-03-08', expected_date: '2025-03-25', status: 'Sent', total: 18750, lines: [
    { desc: 'Industrial motors 5HP', qty: 15, price: 750, received: 0 },
    { desc: 'Motor control panels', qty: 10, price: 625, received: 0 },
  ]},
  { po_number: 'PO-2025-004', vendor: 'V-009', order_date: '2025-03-12', expected_date: '2025-04-01', status: 'Acknowledged', total: 22400, lines: [
    { desc: 'PLC controllers', qty: 8, price: 1800, received: 0 },
    { desc: 'Sensor modules', qty: 25, price: 320, received: 0 },
  ]},
  { po_number: 'PO-2025-005', vendor: 'V-004', order_date: '2025-03-15', expected_date: '2025-03-22', status: 'Received', total: 6250, lines: [
    { desc: 'Hex bolts assortment', qty: 500, price: 2.50, received: 500 },
    { desc: 'Lock washers', qty: 1000, price: 0.50, received: 1000 },
    { desc: 'Machine screws kit', qty: 200, price: 18.75, received: 200 },
  ]},
  { po_number: 'PO-2025-006', vendor: 'V-012', order_date: '2025-03-18', expected_date: '2025-04-15', status: 'Draft', total: 35000, lines: [
    { desc: 'Custom die set - Product A', qty: 2, price: 12500, received: 0 },
    { desc: 'Tooling fixtures', qty: 5, price: 2000, received: 0 },
  ]},
];

for (const po of purchaseOrders) {
  const poId = uuid();
  insertPO.run(poId, po.po_number, vendorMap.get(po.vendor), po.order_date, po.expected_date, po.status, po.total, 0, po.total, 
    '500 Manufacturing Drive, Detroit, MI 48202', null, 'system');
  
  po.lines.forEach((line, idx) => {
    insertPOLine.run(uuid(), poId, idx + 1, line.desc, line.qty, line.price, line.qty * line.price, line.received, accountMap.get('1200'));
  });
}
console.log(`Created ${purchaseOrders.length} purchase orders`);

// ============ Purchase Requisitions ============
const insertReq = db.prepare(`
  INSERT INTO purchase_requisitions (id, requisition_number, requested_by, department, request_date, needed_by, status, description, total_amount, approved_by, approved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertReqLine = db.prepare(`
  INSERT INTO purchase_requisition_lines (id, requisition_id, line_number, description, quantity, unit_price, total_price, gl_account_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const requisitions = [
  { req_number: 'REQ-2025-001', requested_by: 'John Smith', dept: 'Production', date: '2025-03-10', needed: '2025-03-25', status: 'Approved', desc: 'Additional raw materials for Q2 production', total: 28000, approved_by: 'Sarah Johnson', approved_at: '2025-03-11', lines: [
    { desc: 'Aluminum sheets 4x8', qty: 50, price: 320 },
    { desc: 'Copper tubing 1/2"', qty: 200, price: 45 },
    { desc: 'Brass fittings assorted', qty: 100, price: 30 },
  ]},
  { req_number: 'REQ-2025-002', requested_by: 'Mike Davis', dept: 'Maintenance', date: '2025-03-15', needed: '2025-03-30', status: 'Pending', desc: 'Equipment maintenance supplies', total: 8500, lines: [
    { desc: 'Replacement filters', qty: 25, price: 180 },
    { desc: 'Lubricant drums', qty: 10, price: 350 },
    { desc: 'Gasket material rolls', qty: 15, price: 100 },
  ]},
  { req_number: 'REQ-2025-003', requested_by: 'Lisa Chen', dept: 'R&D', date: '2025-03-18', needed: '2025-04-15', status: 'Pending', desc: 'Prototype components', total: 15200, lines: [
    { desc: 'Specialty alloy samples', qty: 5, price: 2500 },
    { desc: 'Testing equipment parts', qty: 10, price: 220 },
  ]},
  { req_number: 'REQ-2025-004', requested_by: 'Tom Wilson', dept: 'Production', date: '2025-03-20', needed: '2025-04-10', status: 'Draft', desc: 'Supplemental Q2 materials', total: 42000, lines: [
    { desc: 'Steel plate 1/4"', qty: 100, price: 280 },
    { desc: 'Stainless steel rod', qty: 50, price: 200 },
    { desc: 'Welding wire spools', qty: 40, price: 100 },
  ]},
];

for (const req of requisitions) {
  const reqId = uuid();
  insertReq.run(reqId, req.req_number, req.requested_by, req.dept, req.date, req.needed, req.status, req.desc, req.total, req.approved_by || null, req.approved_at || null);
  
  req.lines.forEach((line, idx) => {
    insertReqLine.run(uuid(), reqId, idx + 1, line.desc, line.qty, line.price, line.qty * line.price, accountMap.get('1200'));
  });
}
console.log(`Created ${requisitions.length} purchase requisitions`);

// ============ Goods Receipts ============
const insertGR = db.prepare(`
  INSERT INTO goods_receipts (id, receipt_number, purchase_order_id, receipt_date, received_by, status, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Get PO IDs for receipts
const poRows = db.prepare('SELECT id, po_number FROM purchase_orders WHERE status IN (?, ?)').all('Received', 'Partial') as { id: string; po_number: string }[];
const poIdMap = new Map(poRows.map(r => [r.po_number, r.id]));

const receipts = [
  { receipt_number: 'GR-2025-001', po: 'PO-2025-001', date: '2025-03-14', received_by: 'Frank Miller', status: 'Complete', notes: 'All items received in good condition' },
  { receipt_number: 'GR-2025-002', po: 'PO-2025-002', date: '2025-03-19', received_by: 'Frank Miller', status: 'Partial', notes: 'Partial shipment - awaiting remaining bearings and couplings' },
  { receipt_number: 'GR-2025-003', po: 'PO-2025-005', date: '2025-03-21', received_by: 'Dave Thompson', status: 'Complete', notes: 'Verified against packing slip' },
];

for (const gr of receipts) {
  insertGR.run(uuid(), gr.receipt_number, poIdMap.get(gr.po), gr.date, gr.received_by, gr.status, gr.notes);
}
console.log(`Created ${receipts.length} goods receipts`);

console.log('\n✓ Database seeded successfully!');
console.log(`Database location: ${dbPath}`);
