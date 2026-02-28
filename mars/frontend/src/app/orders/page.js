'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * =====================================================================
 * ORDERS PAGE — /orders
 * =====================================================================
 *
 * PURPOSE: Shows the logged-in user's order history.
 *          Each order displays its status, total, date, and items.
 *
 * WHO CAN ACCESS: Any logged-in user (customer sees their purchases).
 *
 * DATA FLOW:
 * 1. Page loads → check auth → redirect if not logged in
 * 2. GET /api/orders/my-orders (JWT token sent automatically)
 * 3. Backend queries: SELECT * FROM Orders WHERE Customer_ID = $1
 * 4. Also aggregates order items via json_agg()
 * 5. Returns: array of order objects, each with an "items" array
 *
 * BACKEND ENDPOINT: GET /api/orders/my-orders
 * RESPONSE FORMAT:
 *   [{
 *     order_id, customer_id, total_amount, order_status, order_date,
 *     delivery_fee, coupon_id,
 *     items: [{ product_id, quantity, net_price }]
 *   }]
 *
 * ORDER STATUSES (from schema):
 *   Pending → Processing → Shipped → Delivered → Cancelled
 *   Each status gets a different color badge.
 * =====================================================================
 */
export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);       // Array of orders
  const [loading, setLoading] = useState(true);   // Data loading state
  const [error, setError] = useState('');          // Error message

  /**
   * ── AUTH CHECK + DATA FETCH ──────────────────────────
   * Wait for auth to load → if not logged in, redirect.
   * If logged in → fetch orders from the backend.
   */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, authLoading]);

  /**
   * ── STATUS BADGE COLORS ──────────────────────────────
   * Maps each order status to a color scheme for the badge.
   * Returns Tailwind classes for text and background color.
   */
  const getStatusStyle = (status) => {
    const styles = {
      'Pending':    'text-yellow-400 bg-yellow-400/10',
      'Processing': 'text-blue-400 bg-blue-400/10',
      'Shipped':    'text-purple-400 bg-purple-400/10',
      'Delivered':  'text-green-400 bg-green-400/10',
      'Cancelled':  'text-red-400 bg-red-400/10',
    };
    return styles[status] || 'text-gray-400 bg-gray-400/10';
  };

  // ── LOADING STATE ──────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-5 bg-[#1A1A1A] rounded w-40" />
                  <div className="h-5 bg-[#1A1A1A] rounded w-24" />
                </div>
                <div className="h-4 bg-[#1A1A1A] rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── PAGE HEADER ─────────────────────────────── */}
        <h1 className="text-4xl font-bold text-white mb-2">
          My <span className="text-[#E85D26]">Orders</span>
        </h1>
        <p className="text-gray-400 mb-8">
          {orders.length} order{orders.length !== 1 ? 's' : ''} placed
        </p>

        {/* ── EMPTY STATE ─────────────────────────────── */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-6xl block mb-4">📋</span>
            <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-gray-400 mb-6">When you place an order, it will appear here.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* ── ORDERS LIST ──────────────────────────────── */
          <div className="space-y-4">
            {orders.map((order) => (
              /* ── SINGLE ORDER CARD ────────────────────
                 Shows: Order ID, Date, Status, Items, Total
                 ─────────────────────────────────────── */
              <div
                key={order.order_id}
                className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden"
              >
                {/* Order header row */}
                <div className="px-6 py-4 border-b border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {/* Order ID (shortened UUID for readability) */}
                    <p className="text-sm text-gray-500">
                      Order <span className="text-gray-300 font-mono">#{order.order_id?.slice(0, 8)}</span>
                    </p>
                    {/* Order date */}
                    <p className="text-xs text-gray-600">
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Date N/A'}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>

                {/* Order items list */}
                <div className="px-6 py-4">
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">×{item.quantity}</span>
                            <Link
                              href={`/products/${item.product_id}`}
                              className="text-gray-300 hover:text-[#E85D26] transition-colors truncate"
                            >
                              Product #{item.product_id?.slice(0, 8)}
                            </Link>
                          </div>
                          <span className="text-gray-400">
                            ${parseFloat(item.net_price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No items data available</p>
                  )}
                </div>

                {/* Order footer — total amount */}
                <div className="px-6 py-4 bg-[#0D0D0D] flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {order.delivery_fee > 0 && (
                      <span>Delivery: ${parseFloat(order.delivery_fee).toFixed(2)} · </span>
                    )}
                    <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-[#E85D26]">
                      ${parseFloat(order.total_amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
