import { useEffect, useState } from 'react';
import { Search, Building2, Mail, Phone } from 'lucide-react';

interface Vendor {
  id: string;
  vendor_number: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  payment_terms: string;
  is_active: number;
  open_balance: number;
  open_invoices: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/ap/vendors')
      .then((res) => res.json())
      .then(setVendors)
      .finally(() => setLoading(false));
  }, []);

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.vendor_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">Manage your vendor relationships</p>
        </div>
        <div className="text-sm text-gray-500">{vendors.length} vendors</div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                      <p className="text-xs text-gray-500">{vendor.vendor_number}</p>
                    </div>
                  </div>
                  <span className={`badge ${vendor.is_active ? 'badge-success' : 'badge-gray'}`}>
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  {vendor.contact_name && (
                    <p className="text-gray-600">{vendor.contact_name}</p>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail size={14} />
                      <span>{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone size={14} />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Open Balance</p>
                    <p className={`font-semibold ${vendor.open_balance > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {formatCurrency(vendor.open_balance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Open Invoices</p>
                    <p className="font-semibold text-gray-900">{vendor.open_invoices}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
