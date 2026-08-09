import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Suppliers() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', contactPerson: '', email: '', phone: '', leadTimeDays: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((res) => res.data)
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/suppliers', form),
    onSuccess: () => {
      toast.success('Supplier created');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setForm({ name: '', contactPerson: '', email: '', phone: '', leadTimeDays: 0 });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      toast.success('Supplier deleted');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Suppliers</h1>

      {hasRole('superadmin', 'storekeeper') && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="bg-white border rounded-lg p-5 mb-6 grid grid-cols-5 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <button type="submit" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-md">Add</button>
        </form>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td className="px-4 py-4" colSpan={4}>Loading...</td></tr>
            ) : data?.suppliers?.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.contactPerson || '—'}</td>
                <td className="px-4 py-2">{s.phone}</td>
                <td className="px-4 py-2 text-right">
                  {hasRole('superadmin') && (
                    <button onClick={() => deleteMutation.mutate(s._id)} className="text-red-600 hover:underline">Delete</button>
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
