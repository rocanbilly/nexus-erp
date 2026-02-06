import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Building2, FileText, Clock, AlertTriangle, DollarSign } from 'lucide-react';

interface APData {
  aging: any;
  totals: { current: number; days_1_30: number; days_31_60: number; days_61_90: number; days_over_90: number; total: number };
}

interface PaymentQueueItem {
  id: string;
  invoice_number: string;
  vendor_name: string;
  due_date: string;
  balance_due: number;
  days_until_due: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function AccountsPayable() {
  const [agingData, setAgingData] = useState<APData | null>(null);
  const [paymentQueue, setPaymentQueue] = useState<PaymentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/ap/aging').then(r => r.json()),
      fetch('/api/ap/payment-queue').then(r => r.json())
    ])
      .then(([aging, queue]) => {
        setAgingData(aging);
        setPaymentQueue(queue);
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
        <h1 className="text-2xl font-bold text-gray-900">Accounts Payable</h1>
        <p className="text-gray-500 mt-1">Manage vendor invoices and payments</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/ap/invoices" className="card hover:shadow-md transition-shadow">
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

        <Link to="/ap/aging" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Aging Report</p>
              <p className="text-sm text-gray-500">View aging details</p>
            </div>
          </div>
        </Link>

        <Link to="/ap/vendors" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vendors</p>
              <p className="text-sm text-gray-500">Manage vendors</p>
            </div>
          </div>
        </Link>

        <div className="card bg-red-50 border-red-200">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-800">{formatCurrency(overdueAmount)}</p>
              <p className="text-sm text-red-600">Total Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aging Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">AP Aging Summary</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(agingData?.totals.current || 0)}
              </p>
              <p className="text-sm text-green-600 mt-1">Current</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-700">
                {formatCurrency(agingData?.totals.days_1_30 || 0)}
              </p>
              <p className="text-sm text-yellow-600 mt-1">1-30 Days</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(agingData?.totals.days_31_60 || 0)}
              </p>
              <p className="text-sm text-orange-600 mt-1">31-60 Days</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(agingData?.totals.days_61_90 || 0)}
              </p>
              <p className="text-sm text-red-600 mt-1">61-90 Days</p>
            </div>
            <div className="text-center p-4 bg-red-100 rounded-xl">
              <p className="text-2xl font-bold text-red-800">
                {formatCurrency(agingData?.totals.days_over_90 || 0)}
              </p>
              <p className="text-sm text-red-700 mt-1">90+ Days</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-600">Total Outstanding:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(agingData?.totals.total || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Queue */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Payment Queue</h3>
          <span className="text-sm text-gray-500">Upcoming payments by due date</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Vendor</th>
                <th>Due Date</th>
                <th>Days Until Due</th>
                <th className="text-right">Amount</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {paymentQueue.slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-sm">{item.invoice_number}</td>
                  <td>{item.vendor_name}</td>
                  <td>{item.due_date}</td>
                  <td>
                    <span className={`font-medium ${
                      item.days_until_due < 0 ? 'text-red-600' :
                      item.days_until_due <= 7 ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {item.days_until_due < 0 
                        ? `${Math.abs(Math.round(item.days_until_due))} days overdue`
                        : `${Math.round(item.days_until_due)} days`}
                    </span>
                  </td>
                  <td className="text-right font-mono font-medium">
                    {formatCurrency(item.balance_due)}
                  </td>
                  <td>
                    <span className={`badge ${
                      item.days_until_due < 0 ? 'badge-danger' :
                      item.days_until_due <= 7 ? 'badge-warning' :
                      'badge-info'
                    }`}>
                      {item.days_until_due < 0 ? 'Overdue' :
                       item.days_until_due <= 7 ? 'Urgent' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
