import { useEffect, useState } from 'react';
import { FileText, Filter, Calendar, Search } from 'lucide-react';

interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  source: string;
  status: string;
  total_debit: number;
  total_credit: number;
  line_count: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function GeneralLedger() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    
    fetch(`/api/gl/journal-entries?${params}`)
      .then((res) => res.json())
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [filters.status]);

  const filteredEntries = entries.filter((e) =>
    e.description.toLowerCase().includes(filters.search.toLowerCase()) ||
    e.entry_number.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-gray-500 mt-1">View and manage general ledger transactions</p>
        </div>
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
                  placeholder="Search entries..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
              <option value="Reversed">Reversed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entry #</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th>Lines</th>
                  <th className="text-right">Debit</th>
                  <th className="text-right">Credit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium text-brand-600">
                      {entry.entry_number}
                    </td>
                    <td className="text-gray-600">{entry.entry_date}</td>
                    <td className="max-w-xs truncate">{entry.description}</td>
                    <td>
                      <span className="badge badge-gray">{entry.source}</span>
                    </td>
                    <td className="text-center text-gray-600">{entry.line_count}</td>
                    <td className="text-right font-mono">
                      {formatCurrency(entry.total_debit)}
                    </td>
                    <td className="text-right font-mono">
                      {formatCurrency(entry.total_credit)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          entry.status === 'Posted'
                            ? 'badge-success'
                            : entry.status === 'Draft'
                            ? 'badge-gray'
                            : 'badge-warning'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="text-sm text-gray-500">
          Showing {filteredEntries.length} of {entries.length} entries
        </div>
      </div>
    </div>
  );
}
