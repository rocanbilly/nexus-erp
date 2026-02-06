import { useEffect, useState } from 'react';
import { Search, ChevronRight, Folder, FileText } from 'lucide-react';

interface Account {
  id: string;
  account_number: string;
  name: string;
  type: string;
  sub_type: string;
  normal_balance: string;
  is_active: number;
  balance: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

const TYPE_COLORS: Record<string, string> = {
  Asset: 'bg-blue-100 text-blue-800',
  Liability: 'bg-orange-100 text-orange-800',
  Equity: 'bg-purple-100 text-purple-800',
  Revenue: 'bg-green-100 text-green-800',
  Expense: 'bg-red-100 text-red-800',
};

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetch('/api/gl/accounts')
      .then((res) => res.json())
      .then(setAccounts)
      .finally(() => setLoading(false));
  }, []);

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.account_number.includes(search);
    const matchesType = !typeFilter || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group by type
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const type = account.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

  const typeOrder = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <p className="text-gray-500 mt-1">Manage your account structure and view balances</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Types</option>
              {typeOrder.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {typeOrder.map((type) => {
            const typeAccounts = groupedAccounts[type];
            if (!typeAccounts?.length) return null;

            return (
              <div key={type} className="card overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${TYPE_COLORS[type]}`}>{type}</span>
                    <span className="text-sm text-gray-500">
                      ({typeAccounts.length} accounts)
                    </span>
                  </div>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account #</th>
                      <th>Name</th>
                      <th>Sub-Type</th>
                      <th>Normal Balance</th>
                      <th className="text-right">Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeAccounts.map((account) => (
                      <tr key={account.id}>
                        <td className="font-mono text-sm font-medium">
                          {account.account_number}
                        </td>
                        <td className="flex items-center gap-2">
                          {account.sub_type === 'Header' ? (
                            <Folder size={16} className="text-gray-400" />
                          ) : (
                            <FileText size={16} className="text-gray-400" />
                          )}
                          {account.name}
                        </td>
                        <td className="text-gray-600">{account.sub_type}</td>
                        <td className="text-gray-600">{account.normal_balance}</td>
                        <td className={`text-right font-mono ${
                          account.balance < 0 ? 'text-red-600' : ''
                        }`}>
                          {account.sub_type !== 'Header' ? formatCurrency(account.balance) : '—'}
                        </td>
                        <td>
                          <span className={`badge ${account.is_active ? 'badge-success' : 'badge-gray'}`}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
