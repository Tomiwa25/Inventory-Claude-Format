import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(null); // 'in' | 'out' | 'adjust' | null
  const [form, setForm] = useState({ productId: '', quantity: '', newQuantity: '', note: '' });

  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['movements', typeFilter],
    queryFn: () => api.get('/stock/movements', { params: { type: typeFilter || undefined } }).then((res) => res.data)
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.get('/products/getallproducts', { params: { limit: 200 } }).then((res) => res.data)
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (showForm === 'in') return api.post('/stock/in', { productId: form.productId, quantity: form.quantity, note: form.note });
      if (showForm === 'out') return api.post('/stock/out', { productId: form.productId, quantity: form.quantity, note: form.note });
      return api.post('/stock/adjust', { productId: form.productId, newQuantity: form.newQuantity, note: form.note });
    },
    onSuccess: () => {
      toast.success('Stock updated');
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(null);
      setForm({ productId: '', quantity: '', newQuantity: '', note: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Stock Movements</h1>
        {hasRole('superadmin', 'storekeeper', 'salesperson') && (
          <div className="flex gap-2">
            <button onClick={() => setShowForm('in')} className="bg-green-700 text-white text-sm px-3 py-2 rounded-md">Stock In</button>
            <button onClick={() => setShowForm('out')} className="bg-red-700 text-white text-sm px-3 py-2 rounded-md">Stock Out</button>
            <button onClick={() => setShowForm('adjust')} className="bg-slate-700 text-white text-sm px-3 py-2 rounded-md">Adjust</button>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="bg-white border rounded-lg p-5 mb-6 grid grid-cols-3 gap-4">
          <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
            <option value="">Select product...</option>
            {productsData?.products?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku}) — qty {p.quantity}</option>)}
          </select>
          {showForm === 'adjust' ? (
            <input required type="number" min="0" placeholder="New total quantity" value={form.newQuantity} onChange={(e) => setForm({ ...form, newQuantity: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          ) : (
            <input required type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          )}
          <input placeholder="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <div className="col-span-3 flex gap-2">
            <button type="submit" disabled={mutation.isPending} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">Confirm</button>
            <button type="button" onClick={() => setShowForm(null)} className="text-sm px-4 py-2 rounded-md border">Cancel</button>
          </div>
        </form>
      )}

      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm mb-4">
        <option value="">All types</option>
        <option value="IN">IN</option>
        <option value="OUT">OUT</option>
        <option value="ADJUSTMENT">ADJUSTMENT</option>
      </select>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Before → After</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">By</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-4" colSpan={7}>Loading...</td></tr>
            ) : movementsData?.movements?.map((m) => (
              <tr key={m._id} className="border-t">
                <td className="px-4 py-2">{m.product?.name} ({m.product?.sku})</td>
                <td className="px-4 py-2">
                  <span className={m.type === 'OUT' ? 'text-red-600' : m.type === 'IN' ? 'text-green-600' : 'text-slate-600'}>{m.type}</span>
                </td>
                <td className="px-4 py-2">{m.quantity}</td>
                <td className="px-4 py-2">{m.previousQuantity} → {m.newQuantity}</td>
                <td className="px-4 py-2">{m.reason}</td>
                <td className="px-4 py-2">{m.performedBy?.name}</td>
                <td className="px-4 py-2">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
