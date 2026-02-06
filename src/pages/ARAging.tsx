import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AgingRow {
  customer_id: string; customer_number: string; customer_name: string; credit_limit: number;
  current: number; days_1_30: number; days_31_60: number; days_61_90: number; days_over_90: number; total: number;
}

interface AgingData {
  aging: AgingRow[];
  totals: { current: number; days_1_30: number; days_31_60: number; days_61_90: number; days_over_90: number; total: number };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

const BUCKET_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

export default function ARAging() {
  const [data, setData] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ar/aging').then((res) => res.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  if (!data) return null;

  const chartData = [
    { name: 'Current', value: data.totals.current, color: BUCKET_COLORS[0] },
    { name: '1-30 Days', value: data.totals.days_1_30, color: BUCKET_COLORS[1] },
    { name: '31-60 Days', value: data.totals.days_31_60, color: BUCKET_COLORS[2] },
    { name: '61-90 Days', value: data.totals.days_61_90, color: BUCKET_COLORS[3] },
    { name: '90+ Days', value: data.totals.days_over_90, color: BUCKET_COLORS[4] },
  ];

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">AR Aging Report</h1><p className="text-gray-500 mt-1">Analysis of outstanding customer invoices by age</p></div>

      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-gray-900">Aging Distribution</h3></div>
        <div className="card-body h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header"><h3 className="font-semibold text-gray-900">Aging by Customer</h3></div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Customer</th><th className="text-right">Credit Limit</th><th className="text-right">Current</th><th className="text-right">1-30 Days</th><th className="text-right">31-60 Days</th><th className="text-right">61-90 Days</th><th className="text-right">90+ Days</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.aging.map((row) => (
                <tr key={row.customer_id}>
                  <td><div><p className="font-medium">{row.customer_name}</p><p className="text-xs text-gray-500">{row.customer_number}</p></div></td>
                  <td className="text-right font-mono text-gray-500">{formatCurrency(row.credit_limit)}</td>
                  <td className="text-right font-mono">{row.current > 0 ? formatCurrency(row.current) : '—'}</td>
                  <td className="text-right font-mono text-yellow-600">{row.days_1_30 > 0 ? formatCurrency(row.days_1_30) : '—'}</td>
                  <td className="text-right font-mono text-orange-600">{row.days_31_60 > 0 ? formatCurrency(row.days_31_60) : '—'}</td>
                  <td className="text-right font-mono text-red-500">{row.days_61_90 > 0 ? formatCurrency(row.days_61_90) : '—'}</td>
                  <td className="text-right font-mono text-red-700 font-medium">{row.days_over_90 > 0 ? formatCurrency(row.days_over_90) : '—'}</td>
                  <td className="text-right font-mono font-semibold">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr><td colSpan={2}>Totals</td><td className="text-right font-mono">{formatCurrency(data.totals.current)}</td><td className="text-right font-mono">{formatCurrency(data.totals.days_1_30)}</td><td className="text-right font-mono">{formatCurrency(data.totals.days_31_60)}</td><td className="text-right font-mono">{formatCurrency(data.totals.days_61_90)}</td><td className="text-right font-mono">{formatCurrency(data.totals.days_over_90)}</td><td className="text-right font-mono">{formatCurrency(data.totals.total)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
