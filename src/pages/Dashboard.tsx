import { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  ShoppingCart,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardData {
  cashPosition: number;
  receivables: number;
  payables: number;
  revenueYTD: number;
  expensesYTD: number;
  netIncome: number;
  apAging: { current: number; days_1_30: number; days_31_60: number; days_61_90: number; days_over_90: number };
  arAging: { current: number; days_1_30: number; days_31_60: number; days_61_90: number; days_over_90: number };
  recentTransactions: any[];
  revenueTrend: { month: string; revenue: number }[];
  expenseTrend: { month: string; expenses: number }[];
  openPOs: number;
  pendingReqs: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyShort(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

const AGING_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">Failed to load dashboard data</div>
    );
  }

  // Prepare chart data
  const trendData = data.revenueTrend.map((r, i) => ({
    month: r.month,
    revenue: r.revenue,
    expenses: data.expenseTrend[i]?.expenses || 0,
  }));

  const apAgingData = [
    { name: 'Current', value: data.apAging.current || 0 },
    { name: '1-30 Days', value: data.apAging.days_1_30 || 0 },
    { name: '31-60 Days', value: data.apAging.days_31_60 || 0 },
    { name: '61-90 Days', value: data.apAging.days_61_90 || 0 },
    { name: '90+ Days', value: data.apAging.days_over_90 || 0 },
  ].filter((d) => d.value > 0);

  const arAgingData = [
    { name: 'Current', value: data.arAging.current || 0 },
    { name: '1-30 Days', value: data.arAging.days_1_30 || 0 },
    { name: '31-60 Days', value: data.arAging.days_31_60 || 0 },
    { name: '61-90 Days', value: data.arAging.days_61_90 || 0 },
    { name: '90+ Days', value: data.arAging.days_over_90 || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your financial position and performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <span className="badge badge-success">Cash</span>
          </div>
          <p className="metric-value mt-4">{formatCurrency(data.cashPosition)}</p>
          <p className="metric-label">Cash Position</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Receipt size={24} className="text-blue-600" />
            </div>
            <span className="badge badge-info">AR</span>
          </div>
          <p className="metric-value mt-4">{formatCurrency(data.receivables)}</p>
          <p className="metric-label">Accounts Receivable</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-orange-600" />
            </div>
            <span className="badge badge-warning">AP</span>
          </div>
          <p className="metric-value mt-4">{formatCurrency(data.payables)}</p>
          <p className="metric-label">Accounts Payable</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              data.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {data.netIncome >= 0 ? (
                <TrendingUp size={24} className="text-green-600" />
              ) : (
                <TrendingDown size={24} className="text-red-600" />
              )}
            </div>
            <span className={`badge ${data.netIncome >= 0 ? 'badge-success' : 'badge-danger'}`}>
              YTD
            </span>
          </div>
          <p className="metric-value mt-4">{formatCurrency(data.netIncome)}</p>
          <p className="metric-label">Net Income YTD</p>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.revenueYTD)}</p>
            <p className="text-sm text-gray-500">Revenue YTD</p>
          </div>
        </div>

        <div className="metric-card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingDown size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.expensesYTD)}</p>
            <p className="text-sm text-gray-500">Expenses YTD</p>
          </div>
        </div>

        <div className="metric-card flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <ShoppingCart size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{data.openPOs}</p>
            <p className="text-sm text-gray-500">Open Purchase Orders</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Revenue vs Expenses Trend</h3>
          </div>
          <div className="card-body h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => formatCurrencyShort(v)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AP & AR Aging */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">AP Aging</h3>
            </div>
            <div className="card-body h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={apAgingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {apAgingData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={AGING_COLORS[index % AGING_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">AR Aging</h3>
            </div>
            <div className="card-body h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={arAgingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {arAgingData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={AGING_COLORS[index % AGING_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <a href="/gl" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Source</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="font-mono text-sm">{tx.entry_number}</td>
                  <td className="text-gray-600">{tx.entry_date}</td>
                  <td>{tx.description}</td>
                  <td>
                    <span className="badge badge-gray">{tx.source}</span>
                  </td>
                  <td className="text-right font-medium">{formatCurrency(tx.amount)}</td>
                  <td>
                    <span
                      className={`badge ${
                        tx.status === 'Posted'
                          ? 'badge-success'
                          : tx.status === 'Draft'
                          ? 'badge-gray'
                          : 'badge-warning'
                      }`}
                    >
                      {tx.status}
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
