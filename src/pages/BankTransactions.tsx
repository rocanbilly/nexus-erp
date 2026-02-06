import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Filter
} from 'lucide-react';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number_last4: string;
  account_type: string;
  gl_account_number: string;
  gl_account_name: string;
  current_balance: number;
  opening_balance: number;
}

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  check_number: string | null;
  payee: string;
  description: string;
  amount: number;
  is_cleared: boolean;
  cleared_date: string | null;
  reconciled_statement_date: string | null;
  reference: string;
}

type TransactionType = 'Deposit' | 'Withdrawal' | 'Check' | 'Transfer' | 'Fee' | 'Interest' | 'Adjustment';

export default function BankTransactions() {
  const { accountId } = useParams<{ accountId: string }>();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterCleared, setFilterCleared] = useState<'all' | 'cleared' | 'uncleared'>('all');
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'Withdrawal' as TransactionType,
    check_number: '',
    payee: '',
    description: '',
    amount: 0,
    reference: ''
  });

  useEffect(() => {
    fetchAccount();
    fetchTransactions();
  }, [accountId, filterCleared]);

  const fetchAccount = async () => {
    try {
      const res = await fetch(`http://localhost:3900/api/banking/accounts/${accountId}`);
      const data = await res.json();
      setAccount(data);
    } catch (error) {
      console.error('Failed to fetch account:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      let url = `http://localhost:3900/api/banking/accounts/${accountId}/transactions`;
      if (filterCleared !== 'all') {
        url += `?cleared=${filterCleared === 'cleared'}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Adjust amount based on transaction type
    let adjustedAmount = Math.abs(formData.amount);
    if (['Withdrawal', 'Check', 'Fee', 'Transfer'].includes(formData.transaction_type)) {
      adjustedAmount = -adjustedAmount;
    }
    
    const payload = {
      ...formData,
      bank_account_id: accountId,
      amount: adjustedAmount
    };
    
    try {
      const url = editingTransaction 
        ? `http://localhost:3900/api/banking/transactions/${editingTransaction.id}`
        : 'http://localhost:3900/api/banking/transactions';
      
      const res = await fetch(url, {
        method: editingTransaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setEditingTransaction(null);
        resetForm();
        fetchAccount();
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const res = await fetch(`http://localhost:3900/api/banking/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchAccount();
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_date: transaction.transaction_date,
      transaction_type: transaction.transaction_type as TransactionType,
      check_number: transaction.check_number || '',
      payee: transaction.payee || '',
      description: transaction.description || '',
      amount: Math.abs(transaction.amount),
      reference: transaction.reference || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'Withdrawal',
      check_number: '',
      payee: '',
      description: '',
      amount: 0,
      reference: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading || !account) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link to="/banking" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} />
          Back to Bank Accounts
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{account.bank_name}</h1>
            <p className="text-gray-600">
              {account.account_type} •••• {account.account_number_last4} | {account.gl_account_number} - {account.gl_account_name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className={`text-2xl font-bold ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(account.current_balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterCleared}
            onChange={(e) => setFilterCleared(e.target.value as typeof filterCleared)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Transactions</option>
            <option value="uncleared">Uncleared Only</option>
            <option value="cleared">Cleared Only</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/banking/reconcile/${accountId}`}
            className="px-4 py-2 border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50"
          >
            Reconcile
          </Link>
          <button
            onClick={() => {
              setEditingTransaction(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {tx.is_cleared ? (
                      <CheckCircle2 size={18} className="text-green-500" title={`Cleared ${tx.cleared_date}`} />
                    ) : (
                      <Circle size={18} className="text-gray-300" title="Uncleared" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(tx.transaction_date)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm">
                      {tx.amount > 0 ? (
                        <ArrowDownRight size={14} className="text-green-500" />
                      ) : (
                        <ArrowUpRight size={14} className="text-red-500" />
                      )}
                      {tx.transaction_type}
                      {tx.check_number && <span className="text-gray-500 ml-1">#{tx.check_number}</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{tx.payee || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tx.description || '-'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!tx.is_cleared && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-1 text-gray-400 hover:text-brand-600 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as TransactionType })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Check">Check</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Fee">Fee</option>
                    <option value="Interest">Interest</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
              </div>
              {formData.transaction_type === 'Check' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                  <input
                    type="text"
                    value={formData.check_number}
                    onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="1001"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payee</label>
                <input
                  type="text"
                  value={formData.payee}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Vendor or customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Transaction description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {['Withdrawal', 'Check', 'Fee', 'Transfer'].includes(formData.transaction_type) 
                      ? 'Will be recorded as payment (negative)'
                      : 'Will be recorded as deposit (positive)'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Invoice #, PO #, etc."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTransaction(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
