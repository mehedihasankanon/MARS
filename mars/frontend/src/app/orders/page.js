'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState([]);       
  const [loading, setLoading] = useState(true);   
  const [error, setError] = useState('');          

  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnImages, setReturnImages] = useState([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) return;

    setReturnError('');
    setReturnSuccess('');
    setReturnLoading(true);

    try {
      const formData = new FormData();
      formData.append('orderId', returnOrder);
      formData.append('reason', returnReason.trim());
      returnImages.slice(0, 5).forEach((file) => formData.append('images', file));

      await api.post('/returns/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReturnSuccess('Return request submitted successfully. Waiting for seller approval.');
      // Update local state to show 'Return Pending'
      setOrders(orders.map(o => o.order_id === returnOrder ? { ...o, order_status: 'Return Pending' } : o));
      setTimeout(() => {
        setReturnOrder(null);
        setReturnSuccess('');
        setReturnReason('');
        setReturnImages([]);
      }, 2000);
    } catch (err) {
      setReturnError(err.response?.data?.error || 'Failed to submit return request.');
    } finally {
      setReturnLoading(false);
    }
  };

  const [confirmItem, setConfirmItem] = useState(null); // { orderId, productId }
  const [confirmReceivedOk, setConfirmReceivedOk] = useState(true);
  const [confirmFeedback, setConfirmFeedback] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');

  const handleSubmitDeliveryConfirm = async (e) => {
    e.preventDefault();
    if (!confirmItem) return;
    setConfirmError('');
    setConfirmSuccess('');
    setConfirmLoading(true);
    try {
      await api.post(
        `/orders/${confirmItem.orderId}/items/${confirmItem.productId}/delivery-confirmation`,
        { receivedOk: confirmReceivedOk, feedback: confirmFeedback.trim() || null }
      );

      setOrders((prev) =>
        prev.map((o) => {
          if (o.order_id !== confirmItem.orderId) return o;
          return {
            ...o,
            items: (o.items || []).map((it) =>
              it.product_id === confirmItem.productId
                ? { ...it, delivered_confirmed: true }
                : it
            ),
          };
        })
      );

      setConfirmSuccess('Thanks! Your delivery confirmation was saved.');
      setConfirmFeedback('');
      setConfirmReceivedOk(true);
      router.replace(pathname || '/orders');
      setTimeout(() => {
        setConfirmItem(null);
        setConfirmSuccess('');
      }, 2000);
    } catch (err) {
      setConfirmError(err.response?.data?.error || 'Failed to save confirmation.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const [scamModal, setScamModal] = useState(null); // { orderId, productId }
  const [scamDescription, setScamDescription] = useState('');
  const [scamSubmitting, setScamSubmitting] = useState(false);
  const [scamError, setScamError] = useState('');
  const [scamSuccess, setScamSuccess] = useState('');

  const submitScamReport = async (e) => {
    e.preventDefault();
    if (!scamModal || !scamDescription.trim()) return;
    setScamError('');
    setScamSuccess('');
    setScamSubmitting(true);
    try {
      await api.post('/reports/scam', {
        orderId: scamModal.orderId,
        productId: scamModal.productId || null,
        description: scamDescription.trim(),
      });
      setScamSuccess('Scam report submitted. Admin will review it.');
      setTimeout(() => {
        setScamModal(null);
        setScamDescription('');
        setScamSuccess('');
      }, 1500);
    } catch (err) {
      setScamError(err.response?.data?.error || 'Failed to submit scam report.');
    } finally {
      setScamSubmitting(false);
    }
  };

  const [trackingOrder, setTrackingOrder] = useState(null);
  const [shipmentData, setShipmentData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  const handleTrackShipment = async (orderId) => {
    setTrackingOrder(orderId);
    setShipmentData(null);
    setTrackingError('');
    setTrackingLoading(true);
    
    try {
      const res = await api.get(`/shipments/order/${orderId}`);
      setShipmentData(res.data);
    } catch (err) {
      console.error(err);
      setTrackingError(err.response?.data?.message || 'Could not fetch tracking data');
    } finally {
      setTrackingLoading(false);
    }
  };

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

  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const qOrder = searchParams.get('order');
    const qProduct = searchParams.get('product');
    if (!qOrder || !qProduct) return;

    const order = orders.find((o) => o.order_id === qOrder);
    if (!order) return;

    const item = order.items?.find((it) => it.product_id === qProduct);
    if (!item || item.item_status !== 'Delivered' || item.delivered_confirmed) return;

    setConfirmItem({ orderId: qOrder, productId: qProduct });
    setConfirmReceivedOk(true);
    setConfirmFeedback('');
    setConfirmError('');
    setConfirmSuccess('');
  }, [orders, searchParams]);

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-white mb-2">
          My <span className="text-[#E85D26]">Orders</span>
        </h1>
        <p className="text-gray-400 mb-8">
          {orders.length} order{orders.length !== 1 ? 's' : ''} placed
        </p>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-6xl block mb-4"></span>
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

          <div className="space-y-4">
            {orders.map((order) => (

              <div
                key={order.order_id}
                className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden"
              >

                <div className="px-6 py-4 border-b border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>

                    <p className="text-sm text-gray-500">
                      Order <span className="text-gray-300 font-mono">#{order.order_id?.slice(0, 8)}</span>
                    </p>

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

                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>

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
                            {item.item_status && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusStyle(item.item_status)}`}>
                                {item.item_status}
                              </span>
                            )}
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

                <div className="px-6 py-4 bg-[#0D0D0D] flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {order.delivery_fee > 0 && (
                      <span>Delivery: ${parseFloat(order.delivery_fee).toFixed(2)} · </span>
                    )}
                    <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                    {order.payment_method && (
                      <span className="block mt-1">
                        Payment: {order.payment_method}
                        <span className={`ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          order.payment_status === 'Completed' ? 'text-green-400 bg-green-400/10' :
                          order.payment_status === 'Pending' ? 'text-yellow-400 bg-yellow-400/10' :
                          'text-gray-400 bg-gray-400/10'
                        }`}>
                          {order.payment_status}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-right flex flex-col justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      {(() => {
                        const pre = parseFloat(order.total_amount || 0);
                        const paid = parseFloat(
                          order.discounted_net_price != null ? order.discounted_net_price : order.total_amount || 0,
                        );
                        const showStrike = pre > paid + 0.009;
                        return (
                          <>
                            {showStrike && (
                              <p className="text-sm text-gray-500 line-through">${pre.toFixed(2)}</p>
                            )}
                            <p className="text-lg font-bold text-[#E85D26]">${paid.toFixed(2)}</p>
                            {order.coupon_id && showStrike && (
                              <p className="text-[10px] text-green-400 mt-0.5">After coupon</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {['Processing', 'Shipped', 'Delivered'].includes(order.order_status) && (
                      <button 
                        onClick={() => handleTrackShipment(order.order_id)}
                        className="mt-2 text-sm text-[#E85D26] hover:text-[#D14F1E] font-medium underline underline-offset-2 transition-colors"
                      >
                        Track Shipment
                      </button>
                    )}
                    <div className="flex gap-4 items-center mt-2">
                      <button 
                        onClick={() => { setReturnOrder(order.order_id); setReturnError(''); setReturnSuccess(''); }}
                        className="text-sm text-red-500 hover:text-red-400 font-medium underline underline-offset-2 transition-colors"
                      >
                        Request Return
                      </button>
                      <button
                        onClick={() => { setScamModal({ orderId: order.order_id, productId: order.items?.[0]?.product_id || null }); setScamError(''); setScamSuccess(''); }}
                        className="text-sm text-gray-300 hover:text-red-400 font-medium underline underline-offset-2 transition-colors"
                      >
                        Report Scam
                      </button>
                    </div>
                  </div>
                </div>

                {order.items?.some((it) => it.item_status === 'Delivered' && !it.delivered_confirmed) && (
                  <div className="px-6 py-3 border-t border-[#1A1A1A] bg-[#0A0A0A]">
                    <p className="text-xs text-gray-500 mb-2">Delivery confirmation needed:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items
                        .filter((it) => it.item_status === 'Delivered' && !it.delivered_confirmed)
                        .map((it) => (
                          <button
                            key={it.product_id}
                            onClick={() => { setConfirmItem({ orderId: order.order_id, productId: it.product_id }); setConfirmError(''); setConfirmSuccess(''); setConfirmReceivedOk(true); setConfirmFeedback(''); }}
                            className="px-3 py-1.5 text-xs bg-purple-600/20 text-purple-300 border border-purple-600/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                          >
                            Confirm item #{it.product_id?.slice(0, 6)}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setTrackingOrder(null)}>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Shipment Tracking</h3>
              <button onClick={() => setTrackingOrder(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {trackingLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-[#E85D26] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : trackingError ? (
              <p className="text-red-400 text-center py-6">{trackingError}</p>
            ) : shipmentData ? (
              <div className="space-y-6">
                <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#2A2A2A]">
                  <p className="text-sm text-gray-400 mb-1">Tracking Number</p>
                  <p className="text-white font-mono">{shipmentData.tracking_number || 'Pending Assignment'}</p>
                  
                  {shipmentData.estimated_delivery_date && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-1">Estimated Delivery</p>
                      <p className="text-[#E85D26] font-medium text-lg">
                        {new Date(shipmentData.estimated_delivery_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-2">
                  <h4 className="text-white font-bold mb-4">History</h4>
                  <div className="relative pl-5 border-l-2 border-[#E85D26]/30 space-y-6">
                    {shipmentData.history && shipmentData.history.length > 0 ? (
                      shipmentData.history.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[25px] top-1.5 w-3.5 h-3.5 bg-[#E85D26] rounded-full shadow-[0_0_10px_rgba(232,93,38,0.5)] border-2 border-[#111111]" />
                          <p className="text-white font-medium">{step.status}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(step.status_date).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No tracking history yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {/* Return Request Modal */}
      {returnOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !returnLoading && setReturnOrder(null)}>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Request a Return</h3>
            
            {returnSuccess ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-center">
                {returnSuccess}
              </div>
            ) : (
              <form onSubmit={handleRequestReturn} className="space-y-4">
                <p className="text-sm text-gray-400">Please detail exactly why you are returning this order. The seller will review this request before issuing a refund.</p>
                
                {returnError && <p className="text-sm text-red-400">{returnError}</p>}
                
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="I am returning this because..."
                  className="w-full h-32 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E85D26] resize-none"
                  required
                />

                <div>
                  <p className="text-sm text-gray-300 mb-1">Add images (optional)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setReturnImages((prev) => [...prev, ...files].slice(0, 5));
                      e.target.value = '';
                    }}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-[#E85D26] file:text-white hover:file:bg-[#D14F1E]"
                  />
                  {returnImages.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{returnImages.length}/5 image(s) selected</p>
                  )}
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setReturnOrder(null)}
                    disabled={returnLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnLoading || !returnReason.trim()}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {returnLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !confirmLoading && !confirmSuccess && setConfirmItem(null)}>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Confirm Delivery</h3>
            <p className="text-sm text-gray-400 mb-4">
              Confirm whether you received this item properly. If not, your feedback will be shared with the seller.
            </p>
            {confirmSuccess ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-center text-sm">
                {confirmSuccess}
              </div>
            ) : (
            <>
            {confirmError && <p className="text-sm text-red-400 mb-3">{confirmError}</p>}
            <form onSubmit={handleSubmitDeliveryConfirm} className="space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmReceivedOk(true)}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    confirmReceivedOk
                      ? 'bg-green-600/20 border-green-600/40 text-green-300'
                      : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-300 hover:border-green-600/30'
                  }`}
                >
                  Received OK
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReceivedOk(false)}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    !confirmReceivedOk
                      ? 'bg-red-600/15 border-red-600/40 text-red-300'
                      : 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-300 hover:border-red-600/30'
                  }`}
                >
                  Not received properly
                </button>
              </div>

              {!confirmReceivedOk && (
                <textarea
                  value={confirmFeedback}
                  onChange={(e) => setConfirmFeedback(e.target.value)}
                  placeholder="Tell the seller what went wrong (missing parts, damaged, not received, etc.)"
                  className="w-full h-24 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E85D26] resize-none"
                />
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  disabled={confirmLoading}
                  onClick={() => setConfirmItem(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmLoading}
                  className="px-4 py-2 bg-[#E85D26] text-white text-sm font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 transition-colors"
                >
                  {confirmLoading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
            </>
            )}
          </div>
        </div>
      )}

      {/* Scam Report Modal */}
      {scamModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !scamSubmitting && setScamModal(null)}>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Report Scam</h3>
            {scamSuccess ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-center">
                {scamSuccess}
              </div>
            ) : (
              <form onSubmit={submitScamReport} className="space-y-4">
                <p className="text-sm text-gray-400">
                  Your report will be visible to admins only.
                </p>
                {scamError && <p className="text-sm text-red-400">{scamError}</p>}
                <textarea
                  value={scamDescription}
                  onChange={(e) => setScamDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full h-28 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-red-500 resize-none"
                  required
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    disabled={scamSubmitting}
                    onClick={() => setScamModal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={scamSubmitting || !scamDescription.trim()}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {scamSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
