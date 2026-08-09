import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function PurchaseOrders() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantityOrdered: '', unitCost: '' }]);

  const { data: poData, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api.get('/purchase-orders').then((res) => res.data)
  });
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((res) => res.data)
  });
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products/getallproducts', { params: { limit: 200 } }).then((res) => res.data)
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/purchase-orders', { supplier, items }),
    onSuccess: () => {
      toast.success('Purchase order created');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setShowForm(false);
      setSupplier('');
      setItems([{ product: '', quantityOrdered: '', unitCost: '' }]);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx][field] = value;
    setItems(next);
  };

  const statusColor = {
    draft: 'bg-gray-100 text-gray-700',
    ordered: 'bg-blue-100 text-blue-700',
    partially_received: 'bg-amber-100 text-amber-700',
    received: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Purchase Orders</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">
          + New Purchase Order
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="bg-white border rounded-lg p-5 mb-6">
          <select required value={supplier} onChange={(e) => setSupplier(e.target.value)} className="border rounded-md px-3 py-2 text-sm mb-4 w-64">
            <option value="">Select supplier...</option>
            {suppliersData?.suppliers?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3 mb-2">
              <select required value={item.product} onChange={(e) => updateItem(idx, 'product', e.target.value)} className="border rounded-md px-3 py-2 text-sm">
                <option value="">Select product...</option>
                {productsData?.products?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
              <input required type="number" min="1" placeholder="Quantity ordered" value={item.quantityOrdered} onChange={(e) => updateItem(idx, 'quantityOrdered', e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
              <input required type="number" min="0" step="0.01" placeholder="Unit cost" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setItems([...items, { product: '', quantityOrdered: '', unitCost: '' }])} className="text-sm text-slate-700 underline">
              + Add line item
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={createMutation.isPending} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-md border">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2">Supplier</th><th className="px-4 py-2">Items</th><th className="px-4 py-2">Total Cost</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-4" colSpan={5}>Loading...</td></tr>
            ) : poData?.purchaseOrders?.map((po) => (
              <tr key={po._id} className="border-t">
                <td className="px-4 py-2">{po.supplier?.name}</td>
                <td className="px-4 py-2">{po.items.length} line item(s)</td>
                <td className="px-4 py-2">${po.totalCost?.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${statusColor[po.status]}`}>{po.status.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/purchase-orders/${po._id}`} className="text-slate-700 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
