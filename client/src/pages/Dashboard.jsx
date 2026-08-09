import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';

const StatCard = ({ label, value, accent }) => (
  <div className="bg-white rounded-lg border p-5">
    <div className="text-sm text-gray-500">{label}</div>
    <div className={`text-2xl font-semibold mt-1 ${accent || ''}`}>{value}</div>
  </div>
);

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then((res) => res.data)
  });

  if (isLoading) return <div>Loading dashboard...</div>;

  const { summary, recentMovements } = data;

  const chartData = recentMovements
    .slice()
    .reverse()
    .map((m) => ({
      name: m.product?.sku || m.product?.name || 'Unknown',
      quantity: m.type === 'OUT' ? -m.quantity : m.quantity
    }));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Products" value={summary.totalProducts} />
        <StatCard label="Total Units in Stock" value={summary.totalUnits} />
        <StatCard label="Stock Value" value={`$${summary.totalStockValue.toLocaleString()}`} />
        <StatCard
          label="Low Stock Items"
          value={summary.lowStockCount}
          accent={summary.lowStockCount > 0 ? 'text-red-600' : ''}
        />
        <StatCard label="Pending Purchase Orders" value={summary.pendingPurchaseOrders} />
      </div>

      <div className="bg-white rounded-lg border p-5 mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Recent Stock Movements</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="quantity" fill="#1e293b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentMovements.map((m) => (
              <tr key={m._id} className="border-t">
                <td className="px-4 py-2">{m.product?.name} ({m.product?.sku})</td>
                <td className="px-4 py-2">
                  <span className={m.type === 'OUT' ? 'text-red-600' : 'text-green-600'}>{m.type}</span>
                </td>
                <td className="px-4 py-2">{m.quantity}</td>
                <td className="px-4 py-2">{m.reason}</td>
                <td className="px-4 py-2">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
