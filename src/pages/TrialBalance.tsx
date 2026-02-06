import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Download, Calendar } from 'lucide-react';

interface TrialBalanceRow {
  account_number: string;
  name: string;
  type: string;
  normal_balance: string;
  total_debits: number;
  total_credits: number;
  balance: number;
}

interface TrialBalanceData {
  accounts: TrialBalanceRow[];
  totals: { totalDebits: number; totalCredits: number };
  balanced: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

const TYPE_COLORS: Record<string, string> = {
  Asset: 'text-blue-600',
  Liability: 'text-orange-600',
  Equity: 'text-purple-600',
  Revenue: 'text-green-600',
  Expense: 'text-red-600',
};

export default function TrialBalance() {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch(`/api/gl/trial-balance?asOfDate=${asOfDate}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [asOfDate]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-gray-500 mt-1">Verify that debits equal credits across all accounts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Balance Status */}
      {data && (
        <div className={`card ${data.balanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="card-body flex items-center gap-3">
            {data.balanced ? (
              <>
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Trial Balance is in Balance</p>
                  <p className="text-sm text-green-600">Total Debits = Total Credits</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={24} className="text-red-600" />
                <div>
                  <p className="font-semibold text-red-800">Trial Balance is Out of Balance</p>
                  <p className="text-sm text-red-600">
                    Difference: {formatCurrency(Math.abs(data.totals.totalDebits - data.totals.totalCredits))}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          </div>
        ) : data ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account #</th>
                    <th>Account Name</th>
                    <th>Type</th>
                    <th className="text-right">Debits</th>
                    <th className="text-right">Credits</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accounts.map((row) => (
                    <tr key={row.account_number}>
                      <td className="font-mono text-sm">{row.account_number}</td>
                      <td>{row.name}</td>
                      <td>
                        <span className={`font-medium ${TYPE_COLORS[row.type]}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="text-right font-mono">
                        {row.total_debits > 0 ? formatCurrency(row.total_debits) : '—'}
                      </td>
                      <td className="text-right font-mono">
                        {row.total_credits > 0 ? formatCurrency(row.total_credits) : '—'}
                      </td>
                      <td className={`text-right font-mono font-medium ${
                        row.balance < 0 ? 'text-red-600' : ''
                      }`}>
                        {formatCurrency(Math.abs(row.balance))}
                        {row.balance !== 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            {row.normal_balance === 'Debit' ? 'DR' : 'CR'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={3} className="text-right">Totals:</td>
                    <td className="text-right font-mono">{formatCurrency(data.totals.totalDebits)}</td>
                    <td className="text-right font-mono">{formatCurrency(data.totals.totalCredits)}</td>
                    <td className="text-right font-mono">
                      {data.balanced ? (
                        <span className="text-green-600">Balanced</span>
                      ) : (
                        <span className="text-red-600">
                          {formatCurrency(Math.abs(data.totals.totalDebits - data.totals.totalCredits))} diff
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : null}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data?.accounts.filter(a => a.type === 'Asset').length || 0}
            </p>
            <p className="text-sm text-gray-500">Asset Accounts</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data?.accounts.filter(a => a.type === 'Liability' || a.type === 'Equity').length || 0}
            </p>
            <p className="text-sm text-gray-500">Liability & Equity Accounts</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data?.accounts.filter(a => a.type === 'Revenue' || a.type === 'Expense').length || 0}
            </p>
            <p className="text-sm text-gray-500">Income Statement Accounts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
