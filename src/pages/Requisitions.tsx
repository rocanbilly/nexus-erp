import { useEffect, useState } from 'react';
import { Search, User, Calendar } from 'lucide-react';

interface Requisition {
  id: string; requisition_number: string; requested_by: string; department: string;
  request_date: string; needed_by: string; status: string; description: string; total_amount: number; line_count: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'badge-gray', Pending: 'badge-warning', Approved: 'badge-success', Rejected: 'badge-danger', Converted: 'badge-info',
};

export default function Requisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    fetch(`/api/p2p/requisitions?${params}`).then((res) => res.json()).then(setRequisitions).finally(() => setLoading(false));
  }, [filters.status]);

  const filteredReqs = requisitions.filter((r) =>
    r.requisition_number.toLowerCase().includes(filters.search.toLowerCase()) ||
    r.requested_by.toLowerCase().includes(filters.search.toLowerCase()) ||
    r.description?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Purchase Requisitions</h1><p className="text-gray-500 mt-1">Manage internal purchase requests</p></div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search requisitions..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option><option value="Pending">Pending</option>
              <option value="Approved">Approved</option><option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Req #</th><th>Requested By</th><th>Department</th><th>Description</th><th>Request Date</th><th>Needed By</th><th className="text-right">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredReqs.map((req) => (
                  <tr key={req.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium text-brand-600">{req.requisition_number}</td>
                    <td><div className="flex items-center gap-2"><User size={16} className="text-gray-400" /><span>{req.requested_by}</span></div></td>
                    <td><span className="badge badge-gray">{req.department}</span></td>
                    <td className="max-w-xs truncate text-gray-600">{req.description}</td>
                    <td className="text-gray-600">{req.request_date}</td>
                    <td className="text-gray-600">{req.needed_by || '—'}</td>
                    <td className="text-right font-mono font-medium">{formatCurrency(req.total_amount)}</td>
                    <td><span className={`badge ${STATUS_STYLES[req.status] || 'badge-gray'}`}>{req.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
