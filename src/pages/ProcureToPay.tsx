import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, FileText, ClipboardList, Package, TrendingUp, Clock } from 'lucide-react';

interface P2PSummary {
  purchaseOrders: { draft: number; pending: number; partial: number; received: number; open_value: number };
  requisitions: { draft: number; pending: number; approved: number; pending_value: number };
  recentReceipts: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export default function ProcureToPay() {
  const [summary, setSummary] = useState<P2PSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/p2p/summary').then((res) => res.json()).then(setSummary).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Procure to Pay</h1><p className="text-gray-500 mt-1">Manage purchasing workflow from requisition to payment</p></div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/p2p/purchase-orders" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><ShoppingCart size={24} className="text-blue-600" /></div>
            <div><p className="font-semibold text-gray-900">Purchase Orders</p><p className="text-sm text-gray-500">Manage POs</p></div>
          </div>
        </Link>
        <Link to="/p2p/requisitions" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center"><ClipboardList size={24} className="text-purple-600" /></div>
            <div><p className="font-semibold text-gray-900">Requisitions</p><p className="text-sm text-gray-500">Purchase requests</p></div>
          </div>
        </Link>
        <Link to="/p2p/receipts" className="card hover:shadow-md transition-shadow">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Package size={24} className="text-green-600" /></div>
            <div><p className="font-semibold text-gray-900">Goods Receipts</p><p className="text-sm text-gray-500">Receiving log</p></div>
          </div>
        </Link>
      </div>

      {/* PO Summary */}
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-gray-900">Purchase Order Status</h3></div>
        <div className="card-body">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-gray-700">{summary?.purchaseOrders.draft || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Draft</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-3xl font-bold text-blue-700">{summary?.purchaseOrders.pending || 0}</p>
              <p className="text-sm text-blue-600 mt-1">Pending</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <p className="text-3xl font-bold text-yellow-700">{summary?.purchaseOrders.partial || 0}</p>
              <p className="text-sm text-yellow-600 mt-1">Partial</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-3xl font-bold text-green-700">{summary?.purchaseOrders.received || 0}</p>
              <p className="text-sm text-green-600 mt-1">Received</p>
            </div>
            <div className="text-center p-4 bg-brand-50 rounded-xl">
              <p className="text-2xl font-bold text-brand-700">{formatCurrency(summary?.purchaseOrders.open_value || 0)}</p>
              <p className="text-sm text-brand-600 mt-1">Open Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requisition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Requisitions Pending Approval</h3></div>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock size={32} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-gray-900">{summary?.requisitions.pending || 0}</p>
                  <p className="text-gray-500">Awaiting review</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(summary?.requisitions.pending_value || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-gray-900">Recent Activity</h3></div>
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <Package size={32} className="text-green-600" />
              </div>
              <div>
                <p className="text-4xl font-bold text-gray-900">{summary?.recentReceipts || 0}</p>
                <p className="text-gray-500">Receipts this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
