import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [receiveQty, setReceiveQty] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => api.get(`/purchase-orders/${id}`).then((res) => res.data)
  });

  const receiveMutation = useMutation({
    mutationFn: (receivedItems) => api.post(`/purchase-orders/${id}/receive`, { receivedItems }),
    onSuccess: () => {
      toast.success('Stock received');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setReceiveQty({});
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong')
  });

  if (isLoading) return <div>Loading...</div>;
  const po = data.purchaseOrder;

  const handleReceive = () => {
    const receivedItems = Object.entries(receiveQty)
      .filter(([, qty]) => qty && Number(qty) > 0)
      .map(([productId, quantityReceived]) => ({ productId, quantityReceived: Number(quantityReceived) }));
    if (!receivedItems.length) {
      toast.error('Enter a quantity to receive for at least one item');
      return;
    }
    receiveMutation.mutate(receivedItems);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Purchase Order</h1>
      <p className="text-sm text-gray-500 mb-6">Supplier: {po.supplier?.name} · Status: {po.status.replace('_', ' ')}</p>

      <div className="bg-white rounded-lg border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Ordered</th>
              <th className="px-4 py-2">Received</th>
              <th className="px-4 py-2">Remaining</th>
              <th className="px-4 py-2">Receive now</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item) => {
              const remaining = item.quantityOrdered - item.quantityReceived;
              return (
                <tr key={item.product._id} className="border-t">
                  <td className="px-4 py-2">{item.product.name} ({item.product.sku})</td>
                  <td className="px-4 py-2">{item.quantityOrdered}</td>
                  <td className="px-4 py-2">{item.quantityReceived}</td>
                  <td className="px-4 py-2">{remaining}</td>
                  <td className="px-4 py-2">
                    {remaining > 0 && po.status !== 'cancelled' ? (
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        placeholder="0"
                        value={receiveQty[item.product._id] || ''}
                        onChange={(e) => setReceiveQty({ ...receiveQty, [item.product._id]: e.target.value })}
                        className="border rounded-md px-2 py-1 text-sm w-24"
                      />
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {po.status !== 'received' && po.status !== 'cancelled' && (
        <button onClick={handleReceive} disabled={receiveMutation.isPending} className="bg-green-700 text-white text-sm px-4 py-2 rounded-md">
          Confirm Receiving
        </button>
      )}
    </div>
  );
}
