'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { formatPrice } from '@/lib/utils';
import { canCancelOrder, formatTimeRemaining, getCancellationBadgeColor } from '@/lib/order-cancellation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  items: any[];
  created_at: string;
  notes?: string;
  payment_method?: string;
  payment_status?: string;
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, selectedStatus]);

  async function fetchOrders() {
    if (!supabase) return;
    setLoading(true);

    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (selectedStatus !== 'all') {
      query = query.eq('status', selectedStatus);
    }

    const { data, error } = await query;

    if (!error && data) {
      setOrders(data);
    } else if (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  }

  async function handleCancelOrder(orderId: string, createdAt: string, status: string) {
    const cancelCheck = canCancelOrder(createdAt, status);

    if (!cancelCheck.canCancel) {
      alert(`Cannot cancel order\n\n${cancelCheck.reason}`);
      return;
    }

    const confirmCancel = confirm(
      `Cancel Order?\n\nAre you sure you want to cancel this order?\n\nTime remaining: ${formatTimeRemaining(cancelCheck.minutesRemaining)}\n\nThis action cannot be undone.`
    );

    if (!confirmCancel) return;

    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('cancel_order', {
        order_id_param: orderId,
        user_id_param: user?.id,
        cancellation_reason: 'Cancelled by customer'
      });

      if (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order. Please try again or call the restaurant.');
        return;
      }

      alert('Order cancelled successfully.');
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to cancel order. Please try again.');
    }
  }

  const handleReorder = (order: Order) => {
    // Rebuild cart from order items
    const cart: Record<string, number> = {};
    const selectedAddOns: Record<string, any[]> = {};
    const selectedVariations: Record<string, string> = {};
    const selectedSpiceLevels: Record<string, string> = {};

    for (const item of order.items) {
      if (!item.id) continue;
      cart[item.id] = (cart[item.id] || 0) + (item.quantity || 1);
      if (item.addOns?.length) selectedAddOns[item.id] = item.addOns;
      if (item.variation) selectedVariations[item.id] = item.variation;
      if (item.spiceLevel) selectedSpiceLevels[item.id] = item.spiceLevel;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('selectedAddOns', JSON.stringify(selectedAddOns));
    localStorage.setItem('selectedVariations', JSON.stringify(selectedVariations));
    localStorage.setItem('selectedSpiceLevels', JSON.stringify(selectedSpiceLevels));

    router.push('/order');
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      preparing: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700',
      delivered: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    };
    return colors[status] || colors.pending;
  };

  const getStatusDisplay = (status: string) => {
    const displays: any = {
      pending: 'Pending',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return displays[status] || status;
  };

  const getStatusProgress = (status: string) => {
    const progress: any = {
      pending: 25,
      preparing: 50,
      out_for_delivery: 75,
      delivered: 100,
      cancelled: 0
    };
    return progress[status] || 0;
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalSpent: orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0)
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Track and manage your order history
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Total Orders</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-2xl shadow-lg p-6 border-2 border-yellow-300 dark:border-yellow-700">
              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Pending</p>
              <p className="text-4xl font-black text-yellow-800 dark:text-yellow-300">{stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl shadow-lg p-6 border-2 border-blue-300 dark:border-blue-700">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Preparing</p>
              <p className="text-4xl font-black text-blue-800 dark:text-blue-300">{stats.preparing}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl shadow-lg p-6 border-2 border-green-300 dark:border-green-700">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Total Spent</p>
              <p className="text-3xl font-black text-green-800 dark:text-green-300">{formatPrice(stats.totalSpent)}</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Filter by Status</h2>
            <div className="flex gap-3 flex-wrap">
              {['all', 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                    selectedStatus === status
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : getStatusDisplay(status)}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
              <p className="mt-6 text-gray-600 dark:text-gray-400 text-lg font-semibold">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-16 text-center border border-gray-200 dark:border-gray-700">
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-8 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                {selectedStatus === 'all' ? 'No orders yet' : `No ${selectedStatus} orders`}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                {selectedStatus === 'all'
                  ? "Start by ordering something delicious from our menu!"
                  : `You don't have any ${selectedStatus} orders at the moment.`}
              </p>
              <Link href="/menu" className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-bold text-lg shadow-xl">
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-3xl transition-shadow">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-white mb-2">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-white/90 text-sm font-semibold">
                          Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/80 text-sm font-semibold mb-1">Total Amount</p>
                        <p className="text-4xl font-black text-white">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Status Badge and Cancel Button */}
                    <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                      <span className={`inline-block px-6 py-3 rounded-xl font-bold text-lg border-2 ${getStatusColor(order.status)}`}>
                        {getStatusDisplay(order.status)}
                      </span>

                      {/* Cancellation Window */}
                      {(() => {
                        const cancelCheck = canCancelOrder(order.created_at, order.status);
                        if (cancelCheck.canCancel) {
                          const badgeColors = getCancellationBadgeColor(cancelCheck.minutesRemaining);
                          return (
                            <div className="flex items-center gap-3">
                              <div className={`px-4 py-2 rounded-lg ${badgeColors.bg} ${badgeColors.text} border ${badgeColors.border} text-sm font-semibold`}>
                                {formatTimeRemaining(cancelCheck.minutesRemaining)} to cancel
                              </div>
                              <button
                                onClick={() => handleCancelOrder(order.id, order.created_at, order.status)}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
                              >
                                Cancel Order
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Progress Bar */}
                    {order.status !== 'cancelled' && (
                      <div className="mb-8">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                            style={{ width: `${getStatusProgress(order.status)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 mb-6">
                      <h4 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">DELIVERY ADDRESS</p>
                        <p className="text-gray-900 dark:text-white font-semibold">{order.delivery_address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">CONTACT</p>
                        <p className="text-gray-900 dark:text-white font-semibold">{order.customer_phone}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          <strong>Your Note:</strong> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Reorder Button */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => handleReorder(order)}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
