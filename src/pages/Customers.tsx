import { useEffect, useState } from 'react';
import { Search, Users, Mail, Phone } from 'lucide-react';

interface Customer {
  id: string; customer_number: string; name: string; contact_name: string; email: string; phone: string;
  city: string; state: string; payment_terms: string; credit_limit: number; is_active: number; open_balance: number; open_invoices: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/ar/customers').then((res) => res.json()).then(setCustomers).finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.customer_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-gray-500 mt-1">Manage your customer relationships</p></div>
        <div className="text-sm text-gray-500">{customers.length} customers</div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users size={20} className="text-blue-600" /></div>
                    <div><h3 className="font-semibold text-gray-900">{customer.name}</h3><p className="text-xs text-gray-500">{customer.customer_number}</p></div>
                  </div>
                  <span className={`badge ${customer.is_active ? 'badge-success' : 'badge-gray'}`}>{customer.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {customer.contact_name && <p className="text-gray-600">{customer.contact_name}</p>}
                  {customer.email && <div className="flex items-center gap-2 text-gray-500"><Mail size={14} /><span>{customer.email}</span></div>}
                  {customer.phone && <div className="flex items-center gap-2 text-gray-500"><Phone size={14} /><span>{customer.phone}</span></div>}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-gray-500">Credit Limit</p><p className="font-medium text-gray-900 text-sm">{formatCurrency(customer.credit_limit)}</p></div>
                  <div><p className="text-xs text-gray-500">Balance</p><p className={`font-medium text-sm ${customer.open_balance > 0 ? 'text-blue-600' : 'text-gray-900'}`}>{formatCurrency(customer.open_balance)}</p></div>
                  <div><p className="text-xs text-gray-500">Invoices</p><p className="font-medium text-gray-900 text-sm">{customer.open_invoices}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
