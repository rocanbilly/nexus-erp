import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import GeneralLedger from './pages/GeneralLedger';
import ChartOfAccounts from './pages/ChartOfAccounts';
import TrialBalance from './pages/TrialBalance';
import AccountsPayable from './pages/AccountsPayable';
import APInvoices from './pages/APInvoices';
import APAging from './pages/APAging';
import Vendors from './pages/Vendors';
import AccountsReceivable from './pages/AccountsReceivable';
import ARInvoices from './pages/ARInvoices';
import ARAging from './pages/ARAging';
import Customers from './pages/Customers';
import ProcureToPay from './pages/ProcureToPay';
import PurchaseOrders from './pages/PurchaseOrders';
import Requisitions from './pages/Requisitions';
import Receipts from './pages/Receipts';
import BankAccounts from './pages/BankAccounts';
import BankTransactions from './pages/BankTransactions';
import BankReconciliation from './pages/BankReconciliation';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        
        {/* General Ledger */}
        <Route path="gl" element={<GeneralLedger />} />
        <Route path="gl/accounts" element={<ChartOfAccounts />} />
        <Route path="gl/trial-balance" element={<TrialBalance />} />
        
        {/* Accounts Payable */}
        <Route path="ap" element={<AccountsPayable />} />
        <Route path="ap/invoices" element={<APInvoices />} />
        <Route path="ap/aging" element={<APAging />} />
        <Route path="ap/vendors" element={<Vendors />} />
        
        {/* Accounts Receivable */}
        <Route path="ar" element={<AccountsReceivable />} />
        <Route path="ar/invoices" element={<ARInvoices />} />
        <Route path="ar/aging" element={<ARAging />} />
        <Route path="ar/customers" element={<Customers />} />
        
        {/* Procure to Pay */}
        <Route path="p2p" element={<ProcureToPay />} />
        <Route path="p2p/purchase-orders" element={<PurchaseOrders />} />
        <Route path="p2p/requisitions" element={<Requisitions />} />
        <Route path="p2p/receipts" element={<Receipts />} />
        
        {/* Banking */}
        <Route path="banking" element={<BankAccounts />} />
        <Route path="banking/transactions/:accountId" element={<BankTransactions />} />
        <Route path="banking/reconcile/:accountId" element={<BankReconciliation />} />
      </Route>
    </Routes>
  );
}
