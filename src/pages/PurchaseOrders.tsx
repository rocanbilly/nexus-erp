import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface PurchaseOrder {
  id: string; po_number: string; vendor_name: string; vendor_number: string; order_date: string;
  expected_date: string; status: string; total_amount: number; line_count: number; total_ordered: number; total_received: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'badge-gray', Sent: 'badge-info', Acknowledged: 'badge-info', Partial: 'badge-warning', Received: 'badge-success', Closed: 'badge-gray', Cancelled: 'badge-danger',
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    fetch(`/api/p2p/purchase-orders?${params}`).then((res) => res.json()).then(setOrders).finally(() => setLoading(false));
  }, [filters.status]);

  const filteredOrders = orders.filter((o) =>
    o.po_number.toLowerCase().includes(filters.search.toLowerCase()) || o.vendor_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1><p className="text-gray-500 mt-1">Manage vendor purchase orders</p></div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search POs..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option><option value="Sent">Sent</option><option value="Acknowledged">Acknowledged</option>
              <option value="Partial">Partial</option><option value="Received">Received</option>
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
                <tr><th>PO #</th><th>Vendor</th><th>Order Date</th><th>Expected</th><th>Lines</th><th>Received</th><th className="text-right">Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium text-brand-600">{po.po_number}</td>
                    <td><div><p className="font-medium">{po.vendor_name}</p><p className="text-xs text-gray-500">{po.vendor_number}</p></div></td>
                    <td className="text-gray-600">{po.order_date}</td>
                    <td className="text-gray-600">{po.expected_date || '—'}</td>
                    <td className="text-center">{po.line_count}</td>
                    <td><div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${po.total_ordered > 0 ? (po.total_received / po.total_ordered) * 100 : 0}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{po.total_received}/{po.total_ordered}</span>
                    </div></td>
                    <td className="text-right font-mono font-medium">{formatCurrency(po.total_amount)}</td>
                    <td><span className={`badge ${STATUS_STYLES[po.status] || 'badge-gray'}`}>{po.status}</span></td>
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
