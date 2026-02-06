import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  CreditCard, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface BankAccount {
  id: string;
  account_id: string;
  gl_account_number: string;
  gl_account_name: string;
  bank_name: string;
  account_number_last4: string;
  account_type: string;
  opening_balance: number;
  current_balance: number;
  last_reconciled_date: string | null;
  last_reconciled_balance: number | null;
  transaction_count: number;
  uncleared_count: number;
}

interface GLAccount {
  id: string;
  account_number: string;
  name: string;
}

export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [availableGLAccounts, setAvailableGLAccounts] = useState<GLAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    bank_name: '',
    account_number_last4: '',
    routing_number: '',
    account_type: 'Checking',
    opening_balance: 0,
    opening_balance_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAccounts();
    fetchAvailableGLAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:3900/api/banking/accounts');
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGLAccounts = async () => {
    try {
      const res = await fetch('http://localhost:3900/api/banking/available-gl-accounts');
      const data = await res.json();
      setAvailableGLAccounts(data);
    } catch (error) {
      console.error('Failed to fetch GL accounts:', error);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3900/api/banking/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          account_id: '',
          bank_name: '',
          account_number_last4: '',
          routing_number: '',
          account_type: 'Checking',
          opening_balance: 0,
          opening_balance_date: new Date().toISOString().split('T')[0]
        });
        fetchAccounts();
        fetchAvailableGLAccounts();
      }
    } catch (error) {
      console.error('Failed to add bank account:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your bank accounts and reconciliations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={availableGLAccounts.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          Add Bank Account
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No bank accounts</h3>
          <p className="mt-2 text-gray-600">
            Get started by adding your first bank account.
          </p>
          {availableGLAccounts.length === 0 ? (
            <p className="mt-4 text-sm text-amber-600">
              <AlertCircle className="inline mr-1" size={16} />
              You need to create an Asset account in the Chart of Accounts first.
            </p>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Add Bank Account
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="text-brand-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.bank_name}</h3>
                    <p className="text-sm text-gray-500">
                      {account.account_type} •••• {account.account_number_last4}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">GL Account</span>
                  <span className="font-medium">{account.gl_account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Balance</span>
                  <span className={`font-semibold ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(account.current_balance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last Reconciled</span>
                  <span className="flex items-center gap-1">
                    {account.last_reconciled_date ? (
                      <>
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-sm">{formatDate(account.last_reconciled_date)}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-sm text-amber-600">Never</span>
                      </>
                    )}
                  </span>
                </div>
                {account.uncleared_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uncleared Items</span>
                    <span className="text-amber-600 font-medium">{account.uncleared_count}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Link
                  to={`/banking/transactions/${account.id}`}
                  className="flex-1 text-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Transactions
                </Link>
                <Link
                  to={`/banking/reconcile/${account.id}`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  Reconcile
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Bank Account</h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GL Account *
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select GL Account</option>
                  {availableGLAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Chase, Wells Fargo"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Money Market">Money Market</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last 4 Digits
                  </label>
                  <input
                    type="text"
                    value={formData.account_number_last4}
                    onChange={(e) => setFormData({ ...formData, account_number_last4: e.target.value.slice(0, 4) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Balance *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    As of Date *
                  </label>
                  <input
                    type="date"
                    value={formData.opening_balance_date}
                    onChange={(e) => setFormData({ ...formData, opening_balance_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
