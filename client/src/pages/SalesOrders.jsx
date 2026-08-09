import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function SalesOrders() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: '', unitPrice: '' }]);

  const { data: soData, isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => api.get('/sales-orders').then((res) => res.data)
  });
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products/getallproducts', { params: { limit: 200 } }).then((res) => res.data)
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/sales-orders', { customerName, items }),
    onSuccess: () => {
      toast.success('Sales order created');
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setShowForm(false);
      setCustomerName('');
      setItems([{ product: '', quantity: '', unitPrice: '' }]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  const fulfillMutation = useMutation({
    mutationFn: (id) => api.post(`/sales-orders/${id}/fulfill`),
    onSuccess: () => {
      toast.success('Order fulfilled — stock updated');
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Fulfillment failed')
  });

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx][field] = value;
    setItems(next);
  };

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    fulfilled: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Sales Orders</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">
          + New Sales Order
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="bg-white border rounded-lg p-5 mb-6">
          <input required placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="border rounded-md px-3 py-2 text-sm mb-4 w-64" />

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3 mb-2">
              <select required value={item.product} onChange={(e) => updateItem(idx, 'product', e.target.value)} className="border rounded-md px-3 py-2 text-sm">
                <option value="">Select product...</option>
                {productsData?.products?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — qty {p.quantity}</option>)}
              </select>
              <input required type="number" min="1" placeholder="Quantity" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
              <input required type="number" min="0" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
            </div>
          ))}

          <button type="button" onClick={() => setItems([...items, { product: '', quantity: '', unitPrice: '' }])} className="text-sm text-slate-700 underline mt-2">
            + Add line item
          </button>

          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={createMutation.isPending} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-md border">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Items</th><th className="px-4 py-2">Total</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-4" colSpan={5}>Loading...</td></tr>
            ) : soData?.salesOrders?.map((so) => (
              <tr key={so._id} className="border-t">
                <td className="px-4 py-2">{so.customerName}</td>
                <td className="px-4 py-2">{so.items.length} line item(s)</td>
                <td className="px-4 py-2">${so.totalAmount?.toFixed(2)}</td>
                <td className="px-4 py-2"><span className={`px-2 py-1 rounded text-xs ${statusColor[so.status]}`}>{so.status}</span></td>
                <td className="px-4 py-2 text-right">
                  {so.status === 'pending' && (
                    <button onClick={() => fulfillMutation.mutate(so._id)} className="text-green-700 hover:underline">Fulfill</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
