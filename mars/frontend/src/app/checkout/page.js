'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cartItems, setCartItems] = useState([]);      
  const [loadingCart, setLoadingCart] = useState(true);

  const [savedAddresses, setSavedAddresses] = useState([]); 
  const [selectedAddressId, setSelectedAddressId] = useState('new'); 
  const [newAddress, setNewAddress] = useState({
    house: '',
    streetRoad: '',
    city: '',
    zipCode: '',
  });

  const [deliveryFee] = useState(5.99);  
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setCouponError('');
    setCouponSuccess('');
    setApplyingCoupon(true);
    
    try {
      const res = await api.post('/coupons/validate', { coupon_code: couponCode.trim() });
      setAppliedCoupon(res.data);
      const label = res.data.coupon_code || 'Coupon';
      setCouponSuccess(`Applied “${label}” — ${res.data.discount_percent}% off.`);
      setCouponCode('');
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess('');
    setCouponError('');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;

    const loadCheckoutData = async () => {
      try {

        const [cartRes, addrRes] = await Promise.all([
          api.get('/cart'),
          api.get('/addresses'),
        ]);

        const cart = cartRes.data;
        const addresses = addrRes.data;
        setSavedAddresses(addresses);

        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].address_id);
        }

        if (cart.items && cart.items.length > 0) {
          const enriched = await Promise.all(
            cart.items.map(async (item) => {
              try {
                const prodRes = await api.get(`/products/${item.product_id}`);
                return {
                  ...item,
                  name: prodRes.data.name,
                  unit_price: prodRes.data.unit_price,
                };
              } catch {
                return { ...item, name: 'Unknown Product', unit_price: 0 };
              }
            })
          );
          setCartItems(enriched);
        }
      } catch (err) {
        console.error('Failed to load checkout data:', err);
        setError('Failed to load checkout data.');
      } finally {
        setLoadingCart(false);
      }
    };

    loadCheckoutData();
  }, [user]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unit_price || 0) * item.quantity,
    0
  );
  const discountAmount = appliedCoupon ? (subtotal * parseFloat(appliedCoupon.discount_percent)) / 100 : 0;
  const total = subtotal - discountAmount + deliveryFee;

  const handlePlaceOrder = async () => {
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setPlacing(true);

    try {
      let addressId = selectedAddressId;

      if (addressId === 'new') {
        if (!newAddress.streetRoad || !newAddress.city || !newAddress.zipCode) {
          setError('Please fill in street, city, and zip code.');
          setPlacing(false);
          return;
        }

        const addrRes = await api.post('/addresses', {
          house: newAddress.house,
          streetRoad: newAddress.streetRoad,
          city: newAddress.city,
          zipCode: newAddress.zipCode,
          addressType: 'Shipping',
        });
        addressId = addrRes.data.address_id;
      }

      const Items = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      await api.post('/orders', {
        Items,
        addressId,
        couponId: appliedCoupon ? appliedCoupon.coupon_id : null,
        deliveryFee,
        paymentMethod,
      });

      router.push('/orders');
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading || loadingCart) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Checkout</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                  <div className="h-5 bg-[#1A1A1A] rounded w-2/3 mb-3" />
                  <div className="h-4 bg-[#1A1A1A] rounded w-1/3" />
                </div>
              ))}
            </div>
            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !loadingCart) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl block mb-4"></span>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Add items before checking out.</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-[#E85D26]">Checkout</span>
        </h1>
        <p className="text-gray-400 mb-8">Review your order and enter shipping details.</p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">

            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Items ({cartItems.length})
              </h2>
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-[#1A1A1A] last:border-0"
                  >
                    <div>
                      <p className="text-gray-200 font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[#F59E0B] font-medium">
                      ${(parseFloat(item.unit_price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Shipping Address
              </h2>

              {savedAddresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.address_id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddressId === addr.address_id
                          ? 'border-[#E85D26] bg-[#E85D26]/5'
                          : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.address_id}
                        checked={selectedAddressId === addr.address_id}
                        onChange={() => setSelectedAddressId(addr.address_id)}
                        className="mt-1 accent-[#E85D26]"
                      />
                      <div>
                        <p className="text-gray-200 text-sm">
                          {addr.house && `${addr.house}, `}{addr.street_road}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {addr.city}, {addr.zip_code}
                        </p>
                      </div>
                    </label>
                  ))}

                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAddressId === 'new'
                        ? 'border-[#E85D26] bg-[#E85D26]/5'
                        : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value="new"
                      checked={selectedAddressId === 'new'}
                      onChange={() => setSelectedAddressId('new')}
                      className="accent-[#E85D26]"
                    />
                    <span className="text-gray-300 text-sm">+ Add new address</span>
                  </label>
                </div>
              )}

              {selectedAddressId === 'new' && (
                <div className="space-y-4">

                  <div>
                    <label htmlFor="house" className="block text-sm text-gray-400 mb-1">
                      House / Apt #
                    </label>
                    <input
                      type="text"
                      id="house"
                      value={newAddress.house}
                      onChange={(e) => setNewAddress({ ...newAddress, house: e.target.value })}
                      placeholder="e.g. Apt 4B"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="street" className="block text-sm text-gray-400 mb-1">
                      Street / Road <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="street"
                      value={newAddress.streetRoad}
                      onChange={(e) => setNewAddress({ ...newAddress, streetRoad: e.target.value })}
                      placeholder="e.g. 123 Main Street"
                      className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm text-gray-400 mb-1">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="e.g. New York"
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="zip" className="block text-sm text-gray-400 mb-1">
                        Zip Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="zip"
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                        placeholder="e.g. 10001"
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                {['Cash on Delivery', 'Credit Card', 'Debit Card', 'Mobile Banking'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === method
                        ? 'border-[#E85D26] bg-[#E85D26]/5'
                        : 'border-[#2A2A2A] hover:border-[#3A3A3A]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-[#E85D26]"
                    />
                    <span className="text-gray-200 text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. SAVE20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:outline-none focus:border-[#E85D26]"
                  />
                  <button
                    type="submit"
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>

                {couponError && <p className="text-red-400 text-xs">{couponError}</p>}
                
                {appliedCoupon && (
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-green-500 text-sm font-medium">{couponSuccess}</span>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-gray-400 hover:text-white text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal ({cartItems.length} items)</span>
                  <span className="text-gray-200">${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Discount ({appliedCoupon.discount_percent}%)</span>
                    <span className="text-green-400">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery Fee</span>
                  <span className="text-gray-200">${deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-[#2A2A2A] pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-2xl font-bold text-[#E85D26]">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full py-3 px-4 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>

              <Link
                href="/cart"
                className="block text-center text-sm text-gray-400 hover:text-[#E85D26] mt-4 transition-colors"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
