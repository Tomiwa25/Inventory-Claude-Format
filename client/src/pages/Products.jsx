import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', sku: '', size: '', description: '', price: '', costPrice: '', quantity: 0, reorderPoint: 0, reorderQuantity: 0, category: '', supplier: '' };

export default function Products() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products/getallproducts', { params: { search } }).then((res) => res.data)
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((res) => res.data)
  });
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((res) => res.data)
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? api.put(`/products/updateproduct/${editingId}`, form)
        : api.post('/products/createproduct', form),
    onSuccess: () => {
      toast.success(editingId ? 'Product updated' : 'Product created');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/deleteproduct/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name, sku: p.sku, size: p.size, description: p.description,
      price: p.price, costPrice: p.costPrice, quantity: p.quantity,
      reorderPoint: p.reorderPoint, reorderQuantity: p.reorderQuantity,
      category: p.category?._id || '', supplier: p.supplier?._id || ''
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Products</h1>
        {hasRole('superadmin', 'storekeeper') && (
          <button
            onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
            className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md"
          >
            + New Product
          </button>
        )}
      </div>

      <input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-md px-3 py-2 text-sm mb-4 w-72"
      />

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
          className="bg-white border rounded-lg p-5 mb-6 grid grid-cols-3 gap-4"
        >
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input required placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input required type="number" step="0.01" placeholder="Selling price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input required type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input type="number" placeholder="Reorder point" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input type="number" placeholder="Reorder quantity" value={form.reorderQuantity} onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
            <option value="">No category</option>
            {categoriesData?.categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
            <option value="">No supplier</option>
            {suppliersData?.suppliers?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-md px-3 py-2 text-sm col-span-3" />
          <div className="col-span-3 flex gap-2">
            <button type="submit" disabled={saveMutation.isPending} className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">
              {editingId ? 'Save changes' : 'Create product'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-md border">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Qty</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-4" colSpan={6}>Loading...</td></tr>
            ) : data?.products?.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.category?.name || '—'}</td>
                <td className={`px-4 py-2 ${p.quantity <= p.reorderPoint ? 'text-red-600 font-medium' : ''}`}>{p.quantity}</td>
                <td className="px-4 py-2">${p.price}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  {hasRole('superadmin', 'storekeeper') && (
                    <>
                      <button onClick={() => startEdit(p)} className="text-slate-700 hover:underline">Edit</button>
                      <button onClick={() => deleteMutation.mutate(p._id)} className="text-red-600 hover:underline">Delete</button>
                    </>
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
