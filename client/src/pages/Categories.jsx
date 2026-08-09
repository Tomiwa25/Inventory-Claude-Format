import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((res) => res.data)
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/categories', form),
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setForm({ name: '', description: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Categories</h1>

      {hasRole('superadmin', 'storekeeper') && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="bg-white border rounded-lg p-5 mb-6 flex gap-3">
          <input required placeholder="Category name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2 text-sm flex-1" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border rounded-md px-3 py-2 text-sm flex-1" />
          <button type="submit" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">Add</button>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Description</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-4" colSpan={3}>Loading...</td></tr>
            ) : data?.categories?.map((c) => (
              <tr key={c._id} className="border-t">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.description || '—'}</td>
                <td className="px-4 py-2 text-right">
                  {hasRole('superadmin') && (
                    <button onClick={() => deleteMutation.mutate(c._id)} className="text-red-600 hover:underline">Delete</button>
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
