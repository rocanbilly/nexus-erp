import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  CheckCircle2,
  Circle,
  Check,
  X,
  AlertTriangle,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Undo2
} from 'lucide-react';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number_last4: string;
  account_type: string;
  gl_account_number: string;
  gl_account_name: string;
  current_balance: number;
  last_reconciled_date: string | null;
  last_reconciled_balance: number | null;
}

interface Reconciliation {
  id: string;
  bank_account_id: string;
  statement_date: string;
  statement_ending_balance: number;
  beginning_balance: number;
  cleared_deposits: number;
  cleared_payments: number;
  cleared_balance: number;
  difference: number;
  status: 'In Progress' | 'Completed' | 'Voided';
  completed_at: string | null;
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
  reference: string;
}

interface ReconciliationHistory {
  id: string;
  statement_date: string;
  statement_ending_balance: number;
  status: string;
  completed_at: string | null;
}

export default function BankReconciliation() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<ReconciliationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [startFormData, setStartFormData] = useState({
    statement_date: new Date().toISOString().split('T')[0],
    statement_ending_balance: 0
  });

  // Track locally cleared transactions for optimistic UI
  const [localCleared, setLocalCleared] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAccount();
    fetchHistory();
  }, [accountId]);

  useEffect(() => {
    if (reconciliation) {
      fetchUnclearedTransactions();
    }
  }, [reconciliation?.id]);

  const fetchAccount = async () => {
    try {
      const res = await fetch(`http://localhost:3900/api/banking/accounts/${accountId}`);
      const data = await res.json();
      setAccount(data);
      
      // Check for existing in-progress reconciliation
      const histRes = await fetch(`http://localhost:3900/api/banking/accounts/${accountId}/reconciliations`);
      const histData: ReconciliationHistory[] = await histRes.json();
      
      const inProgress = histData.find(r => r.status === 'In Progress');
      if (inProgress) {
        const reconRes = await fetch(`http://localhost:3900/api/banking/reconciliations/${inProgress.id}`);
        const reconData = await reconRes.json();
        setReconciliation(reconData);
        
        // Initialize localCleared with already cleared transactions
        const clearedIds = new Set(reconData.cleared_transactions?.map((t: any) => t.id) || []);
        setLocalCleared(clearedIds);
      }
    } catch (error) {
      console.error('Failed to fetch account:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:3900/api/banking/accounts/${accountId}/reconciliations`);
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchUnclearedTransactions = async () => {
    if (!reconciliation) return;
    
    try {
      const res = await fetch(
        `http://localhost:3900/api/banking/accounts/${accountId}/uncleared?as_of_date=${reconciliation.statement_date}`
      );
      let data: Transaction[] = await res.json();
      
      // Also fetch transactions that are cleared for THIS reconciliation
      const clearedRes = await fetch(`http://localhost:3900/api/banking/reconciliations/${reconciliation.id}`);
      const clearedData = await clearedRes.json();
      const clearedTxs: Transaction[] = clearedData.cleared_transactions || [];
      
      // Merge: uncleared + cleared for this recon
      const txMap = new Map<string, Transaction>();
      for (const tx of data) {
        txMap.set(tx.id, tx);
      }
      for (const tx of clearedTxs) {
        txMap.set(tx.id, { ...tx, is_cleared: true });
      }
      
      const merged = Array.from(txMap.values()).sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );
      
      setTransactions(merged);
      
      // Update localCleared
      const clearedIds = new Set(clearedTxs.map(t => t.id));
      setLocalCleared(clearedIds);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleStartReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3900/api/banking/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_account_id: accountId,
          ...startFormData
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setReconciliation(data);
        setShowStartModal(false);
        fetchHistory();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error('Failed to start reconciliation:', error);
    }
  };

  const handleToggleCleared = async (transactionId: string, currentlyCleared: boolean) => {
    if (!reconciliation) return;
    
    // Optimistic UI update
    setLocalCleared(prev => {
      const next = new Set(prev);
      if (currentlyCleared) {
        next.delete(transactionId);
      } else {
        next.add(transactionId);
      }
      return next;
    });
    
    try {
      const res = await fetch(`http://localhost:3900/api/banking/reconciliations/${reconciliation.id}/toggle-cleared`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          is_cleared: !currentlyCleared
        })
      });
      
      if (res.ok) {
        const totals = await res.json();
        setReconciliation(prev => prev ? { ...prev, ...totals } : null);
      } else {
        // Revert on error
        setLocalCleared(prev => {
          const next = new Set(prev);
          if (currentlyCleared) {
            next.add(transactionId);
          } else {
            next.delete(transactionId);
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to toggle cleared:', error);
    }
  };

  const handleSelectAll = async (type: 'deposits' | 'payments') => {
    if (!reconciliation) return;
    
    const toSelect = transactions
      .filter(t => type === 'deposits' ? t.amount > 0 : t.amount < 0)
      .filter(t => !localCleared.has(t.id))
      .map(t => t.id);
    
    if (toSelect.length === 0) return;
    
    // Optimistic update
    setLocalCleared(prev => {
      const next = new Set(prev);
      toSelect.forEach(id => next.add(id));
      return next;
    });
    
    try {
      const res = await fetch(`http://localhost:3900/api/banking/reconciliations/${reconciliation.id}/bulk-toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_ids: toSelect,
          is_cleared: true
        })
      });
      
      if (res.ok) {
        const totals = await res.json();
        setReconciliation(prev => prev ? { ...prev, ...totals } : null);
      }
    } catch (error) {
      console.error('Failed to select all:', error);
    }
  };

  const handleComplete = async () => {
    if (!reconciliation) return;
    
    try {
      const res = await fetch(`http://localhost:3900/api/banking/reconciliations/${reconciliation.id}/complete`, {
        method: 'PUT'
      });
      
      if (res.ok) {
        navigate(`/banking/transactions/${accountId}`);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  const handleCancel = async () => {
    if (!reconciliation) return;
    if (!confirm('Are you sure you want to cancel this reconciliation? All cleared items will be uncleared.')) return;
    
    try {
      const res = await fetch(`http://localhost:3900/api/banking/reconciliations/${reconciliation.id}/void`, {
        method: 'PUT'
      });
      
      if (res.ok) {
        setReconciliation(null);
        setLocalCleared(new Set());
        fetchHistory();
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
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

  // Compute running totals based on localCleared
  const computedTotals = useMemo(() => {
    if (!reconciliation) return null;
    
    let deposits = 0;
    let payments = 0;
    
    for (const tx of transactions) {
      if (localCleared.has(tx.id)) {
        if (tx.amount > 0) {
          deposits += tx.amount;
        } else {
          payments += Math.abs(tx.amount);
        }
      }
    }
    
    const clearedBalance = reconciliation.beginning_balance + deposits - payments;
    const difference = reconciliation.statement_ending_balance - clearedBalance;
    
    return {
      cleared_deposits: deposits,
      cleared_payments: payments,
      cleared_balance: clearedBalance,
      difference
    };
  }, [transactions, localCleared, reconciliation]);

  // Separate deposits and payments
  const deposits = transactions.filter(t => t.amount > 0);
  const payments = transactions.filter(t => t.amount < 0);

  if (loading || !account) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // If no reconciliation in progress, show start screen
  if (!reconciliation) {
    return (
      <div className="p-6">
        <Link to="/banking" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={20} />
          Back to Bank Accounts
        </Link>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-lg mx-auto mt-12">
          <FileText className="mx-auto h-12 w-12 text-brand-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Reconcile {account.bank_name}
          </h2>
          <p className="text-gray-600 mb-6">
            {account.last_reconciled_date 
              ? `Last reconciled on ${formatDate(account.last_reconciled_date)} with balance ${formatCurrency(account.last_reconciled_balance || 0)}`
              : 'This account has never been reconciled'}
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <History size={18} />
              View History
            </button>
            <button
              onClick={() => setShowStartModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              <CheckCircle2 size={18} />
              Start Reconciliation
            </button>
          </div>
        </div>

        {/* Start Reconciliation Modal */}
        {showStartModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Start Reconciliation</h2>
              <p className="text-gray-600 mb-4">
                Enter your bank statement ending date and balance to begin reconciling.
              </p>
              <form onSubmit={handleStartReconciliation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statement Ending Date *
                  </label>
                  <input
                    type="date"
                    value={startFormData.statement_date}
                    onChange={(e) => setStartFormData({ ...startFormData, statement_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statement Ending Balance *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={startFormData.statement_ending_balance}
                    onChange={(e) => setStartFormData({ ...startFormData, statement_ending_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter the ending balance from your statement"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStartModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                  >
                    Start
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">Reconciliation History</h2>
              {history.filter(h => h.status !== 'In Progress').length === 0 ? (
                <p className="text-gray-600 py-8 text-center">No completed reconciliations yet.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Balance</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.filter(h => h.status !== 'In Progress').map((h) => (
                        <tr key={h.id}>
                          <td className="px-3 py-2 text-sm">{formatDate(h.statement_date)}</td>
                          <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(h.statement_ending_balance)}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              h.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end pt-4 mt-4 border-t">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main reconciliation workbench
  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to="/banking" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft size={20} />
            Back to Bank Accounts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Reconcile: {account.bank_name}
          </h1>
          <p className="text-gray-600">
            Statement Date: {formatDate(reconciliation.statement_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={Math.abs(computedTotals?.difference || 0) > 0.005}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />
            Finish Reconciliation
          </button>
        </div>
      </div>

      {/* Reconciliation Summary Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-6 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Beginning Balance</p>
            <p className="text-lg font-semibold">{formatCurrency(reconciliation.beginning_balance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
              <ArrowDownRight size={12} className="text-green-500" />
              Cleared Deposits
            </p>
            <p className="text-lg font-semibold text-green-600">+{formatCurrency(computedTotals?.cleared_deposits || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
              <ArrowUpRight size={12} className="text-red-500" />
              Cleared Payments
            </p>
            <p className="text-lg font-semibold text-red-600">-{formatCurrency(computedTotals?.cleared_payments || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Cleared Balance</p>
            <p className="text-lg font-semibold">{formatCurrency(computedTotals?.cleared_balance || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Statement Balance</p>
            <p className="text-lg font-semibold">{formatCurrency(reconciliation.statement_ending_balance)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Difference</p>
            <p className={`text-lg font-bold ${
              Math.abs(computedTotals?.difference || 0) < 0.01 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(computedTotals?.difference || 0)}
              {Math.abs(computedTotals?.difference || 0) < 0.01 && (
                <CheckCircle2 className="inline ml-2" size={18} />
              )}
            </p>
          </div>
        </div>
        
        {Math.abs(computedTotals?.difference || 0) > 0.005 && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            <AlertTriangle size={18} />
            <span className="text-sm">
              The difference must be $0.00 to complete the reconciliation. Check off items that appear on your statement.
            </span>
          </div>
        )}
      </div>

      {/* Two-column transaction lists */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Deposits */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <ArrowDownRight size={18} />
              Deposits & Credits ({deposits.length})
            </h3>
            <button
              onClick={() => handleSelectAll('deposits')}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Select All
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {deposits.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No deposits to reconcile</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-10"></th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Payee/Description</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deposits.map((tx) => {
                    const isCleared = localCleared.has(tx.id);
                    return (
                      <tr 
                        key={tx.id} 
                        className={`cursor-pointer hover:bg-gray-50 ${isCleared ? 'bg-green-50' : ''}`}
                        onClick={() => handleToggleCleared(tx.id, isCleared)}
                      >
                        <td className="px-3 py-2">
                          {isCleared ? (
                            <CheckCircle2 size={18} className="text-green-600" />
                          ) : (
                            <Circle size={18} className="text-gray-300" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{formatDate(tx.transaction_date)}</td>
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium">{tx.payee || tx.transaction_type}</div>
                          {tx.description && <div className="text-xs text-gray-500">{tx.description}</div>}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-green-600">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
              <ArrowUpRight size={18} />
              Payments & Checks ({payments.length})
            </h3>
            <button
              onClick={() => handleSelectAll('payments')}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Select All
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No payments to reconcile</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-10"></th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Payee/Description</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((tx) => {
                    const isCleared = localCleared.has(tx.id);
                    return (
                      <tr 
                        key={tx.id} 
                        className={`cursor-pointer hover:bg-gray-50 ${isCleared ? 'bg-red-50' : ''}`}
                        onClick={() => handleToggleCleared(tx.id, isCleared)}
                      >
                        <td className="px-3 py-2">
                          {isCleared ? (
                            <CheckCircle2 size={18} className="text-red-600" />
                          ) : (
                            <Circle size={18} className="text-gray-300" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">{formatDate(tx.transaction_date)}</td>
                        <td className="px-3 py-2 text-sm">
                          <div className="font-medium">
                            {tx.payee || tx.transaction_type}
                            {tx.check_number && <span className="text-gray-500 ml-1">#{tx.check_number}</span>}
                          </div>
                          {tx.description && <div className="text-xs text-gray-500">{tx.description}</div>}
                        </td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-red-600">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
