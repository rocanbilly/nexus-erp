import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';

interface APInvoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  balance_due: number;
  status: string;
  current_status: string;
  aging_bucket: string;
  description: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  Open: 'badge-info',
  Partial: 'badge-warning',
  Paid: 'badge-success',
  Overdue: 'badge-danger',
  Draft: 'badge-gray',
  Void: 'badge-gray',
};

export default function APInvoices() {
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    
    fetch(`/api/ap/invoices?${params}`)
      .then((res) => res.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [filters.status]);

  const filteredInvoices = invoices.filter((i) =>
    i.invoice_number.toLowerCase().includes(filters.search.toLowerCase()) ||
    i.vendor_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    i.description?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalBalance = filteredInvoices.reduce((sum, i) => sum + i.balance_due, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AP Invoices</h1>
          <p className="text-gray-500 mt-1">Manage vendor invoices and track payments</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
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
                  placeholder="Search invoices..."
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
              <option value="Open">Open</option>
              <option value="Overdue">Overdue</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
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
                  <th>Invoice #</th>
                  <th>Vendor</th>
                  <th>Description</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium text-brand-600">
                      {invoice.invoice_number}
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{invoice.vendor_name}</p>
                        <p className="text-xs text-gray-500">{invoice.vendor_number}</p>
                      </div>
                    </td>
                    <td className="max-w-xs truncate text-gray-600">{invoice.description}</td>
                    <td className="text-gray-600">{invoice.invoice_date}</td>
                    <td className="text-gray-600">{invoice.due_date}</td>
                    <td className="text-right font-mono">{formatCurrency(invoice.total_amount)}</td>
                    <td className="text-right font-mono font-medium">
                      {formatCurrency(invoice.balance_due)}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_STYLES[invoice.current_status] || 'badge-gray'}`}>
                        {invoice.current_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <span>Showing {filteredInvoices.length} invoices</span>
      </div>
    </div>
  );
}
