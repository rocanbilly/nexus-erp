import { useEffect, useState } from 'react';
import { Package, User, FileText } from 'lucide-react';

interface Receipt {
  id: string; receipt_number: string; po_number: string; vendor_name: string;
  receipt_date: string; received_by: string; status: string; notes: string;
}

const STATUS_STYLES: Record<string, string> = {
  Partial: 'badge-warning', Complete: 'badge-success', Rejected: 'badge-danger',
};

export default function Receipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/p2p/receipts').then((res) => res.json()).then(setReceipts).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Goods Receipts</h1><p className="text-gray-500 mt-1">Log of received goods against purchase orders</p></div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Package size={24} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{receipts.filter(r => r.status === 'Complete').length}</p><p className="text-sm text-gray-500">Complete Receipts</p></div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center"><Package size={24} className="text-yellow-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{receipts.filter(r => r.status === 'Partial').length}</p><p className="text-sm text-gray-500">Partial Receipts</p></div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><FileText size={24} className="text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{receipts.length}</p><p className="text-sm text-gray-500">Total Receipts</p></div>
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
                <tr><th>Receipt #</th><th>PO #</th><th>Vendor</th><th>Receipt Date</th><th>Received By</th><th>Notes</th><th>Status</th></tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="font-mono text-sm font-medium text-brand-600">{receipt.receipt_number}</td>
                    <td className="font-mono text-sm">{receipt.po_number}</td>
                    <td className="font-medium">{receipt.vendor_name}</td>
                    <td className="text-gray-600">{receipt.receipt_date}</td>
                    <td><div className="flex items-center gap-2"><User size={16} className="text-gray-400" /><span>{receipt.received_by}</span></div></td>
                    <td className="max-w-xs truncate text-gray-500 text-sm">{receipt.notes || '—'}</td>
                    <td><span className={`badge ${STATUS_STYLES[receipt.status] || 'badge-gray'}`}>{receipt.status}</span></td>
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
