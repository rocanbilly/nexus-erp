import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Users, FileText, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface ARData {
  aging: any;
  totals: { current: number; days_1_30: number; days_31_60: number; days_61_90: number; days_over_90: number; total: number };
}

interface CollectionItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  due_date: string;
  balance_due: number;
  days_overdue: number;
  email: string;
  phone: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export default function AccountsReceivable() {
  const [agingData, setAgingData] = useState<ARData | null>(null);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/ar/aging').then(r => r.json()),
      fetch('/api/ar/collections').then(r => r.json())
    ])
      .then(([aging, cols]) => {
        setAgingData(aging);
        setCollections(cols);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const overdueAmount = (agingData?.totals.days_1_30 || 0) + 
    (agingData?.totals.days_31_60 || 0) + 
    (agingData?.totals.days_61_90 || 0) + 
    (agingData?.totals.days_over_90 || 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable</h1>
        <p className="text-gray-500 mt-1">Manage customer invoices and collections</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/ar/invoices" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Invoices</p>
              <p className="text-sm text-gray-500">View all invoices</p>
            </div>
          </div>
        </Link>

        <Link to="/ar/aging" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Aging Report</p>
              <p className="text-sm text-gray-500">View aging details</p>
            </div>
          </div>
        </Link>

        <Link to="/ar/customers" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Customers</p>
              <p className="text-sm text-gray-500">Manage customers</p>
            </div>
          </div>
        </Link>

        <div className="card bg-amber-50 border-amber-200">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">{formatCurrency(overdueAmount)}</p>
              <p className="text-sm text-amber-600">Total Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aging Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">AR Aging Summary</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">{formatCurrency(agingData?.totals.current || 0)}</p>
              <p className="text-sm text-green-600 mt-1">Current</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-700">{formatCurrency(agingData?.totals.days_1_30 || 0)}</p>
              <p className="text-sm text-yellow-600 mt-1">1-30 Days</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-700">{formatCurrency(agingData?.totals.days_31_60 || 0)}</p>
              <p className="text-sm text-orange-600 mt-1">31-60 Days</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-700">{formatCurrency(agingData?.totals.days_61_90 || 0)}</p>
              <p className="text-sm text-red-600 mt-1">61-90 Days</p>
            </div>
            <div className="text-center p-4 bg-red-100 rounded-xl">
              <p className="text-2xl font-bold text-red-800">{formatCurrency(agingData?.totals.days_over_90 || 0)}</p>
              <p className="text-sm text-red-700 mt-1">90+ Days</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-600">Total Outstanding:</span>
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(agingData?.totals.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Collections Queue */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Collections Queue</h3>
          <span className="text-sm text-gray-500">Overdue invoices requiring follow-up</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {collections.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-sm">{item.invoice_number}</td>
                  <td className="font-medium">{item.customer_name}</td>
                  <td className="text-gray-500 text-sm">{item.email || item.phone}</td>
                  <td className="text-gray-600">{item.due_date}</td>
                  <td>
                    <span className={`badge ${
                      item.days_overdue > 60 ? 'badge-danger' :
                      item.days_overdue > 30 ? 'badge-warning' : 'badge-info'
                    }`}>
                      {Math.round(item.days_overdue)} days
                    </span>
                  </td>
                  <td className="text-right font-mono font-medium">{formatCurrency(item.balance_due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
