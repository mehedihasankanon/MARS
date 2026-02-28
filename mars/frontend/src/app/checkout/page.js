'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * =====================================================================
 * CHECKOUT PAGE — /checkout
 * =====================================================================
 *
 * PURPOSE: Final step before placing an order. The user:
 *   1. Reviews their cart items one last time
 *   2. Enters (or selects) a shipping address
 *   3. Clicks "Place Order" to finalize the purchase
 *
 * DATA FLOW:
 *   Page Load:
 *     - GET /api/cart          → cart with items (product_id, quantity, net_price)
 *     - GET /api/addresses     → user's saved addresses
 *     - For each item: GET /api/products/:id → product name + price
 *
 *   Place Order:
 *     a) If "new address" → POST /api/addresses  → returns { address_id }
 *     b) POST /api/orders  → body: { Items, addressId, deliveryFee }
 *        → Backend runs a TRANSACTION:
 *           1. Calculates totalAmount from product prices × quantities
 *           2. INSERT INTO Orders
 *           3. INSERT INTO Order_Items for each item
 *           4. UPDATE Products SET Stock_Quantity -= quantity
 *           5. INSERT INTO Shipments with addressId
 *           6. COMMIT
 *     c) On success redirect to /orders
 *
 * BACKEND ENDPOINTS USED:
 *   GET  /api/cart              (auth)
 *   GET  /api/products/:id      (public)
 *   GET  /api/addresses         (auth)
 *   POST /api/addresses         (auth) — { house, streetRoad, city, zipCode }
 *   POST /api/orders            (auth) — { Items, addressId, deliveryFee }
 *
 * SCHEMA REFERENCE:
 *   Addresses: Address_ID, User_ID, House, Street_Road, City, Zip_Code, Address_Type
 *   Orders: Order_ID, Customer_ID, Coupon_ID, Delivery_Fee, Total_Amount, Order_Status
 *   Order_Items: Order_ID, Product_ID, Quantity, Net_Price
 *   Shipments: Shipment_ID, Order_ID, Address_ID
 * =====================================================================
 */
export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── CART STATE ──────────────────────────────────────
  const [cartItems, setCartItems] = useState([]);      // Enriched items with product details
  const [loadingCart, setLoadingCart] = useState(true);

  // ── ADDRESS STATE ──────────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState([]); // Previously saved addresses
  const [selectedAddressId, setSelectedAddressId] = useState('new'); // 'new' or UUID
  const [newAddress, setNewAddress] = useState({
    house: '',
    streetRoad: '',
    city: '',
    zipCode: '',
  });

  // ── ORDER STATE ────────────────────────────────────
  const [deliveryFee] = useState(5.99);  // Fixed delivery fee
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  /**
   * ── AUTH CHECK ───────────────────────────────────────
   * Redirect to login if not authenticated
   */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, authLoading]);

  /**
   * ── FETCH CART + ADDRESSES ──────────────────────────
   * Parallel fetch: cart items + saved addresses
   * Then enrich cart items with product name & price
   */
  useEffect(() => {
    if (!user) return;

    const loadCheckoutData = async () => {
      try {
        // Fetch cart and addresses in parallel
        const [cartRes, addrRes] = await Promise.all([
          api.get('/cart'),
          api.get('/addresses'),
        ]);

        const cart = cartRes.data;
        const addresses = addrRes.data;
        setSavedAddresses(addresses);

        // If the user has saved addresses, pre-select the first one
        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].address_id);
        }

        // Enrich cart items with product details
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

  /**
   * ── COMPUTE SUBTOTAL ────────────────────────────────
   * Sum of (unit_price × quantity) for all cart items
   */
  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.unit_price || 0) * item.quantity,
    0
  );
  const total = subtotal + deliveryFee;

  /**
   * ── PLACE ORDER HANDLER ─────────────────────────────
   * Steps:
   *   1. Determine address ID (use existing or create new)
   *   2. Build Items array: [{ product_id, quantity }]
   *   3. POST /api/orders
   *   4. Redirect to /orders on success
   */
  const handlePlaceOrder = async () => {
    setError('');

    // Validate items
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setPlacing(true);

    try {
      let addressId = selectedAddressId;

      // ── Step 1: Create new address if needed ───────
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

      // ── Step 2: Build Items array ──────────────────
      const Items = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      // ── Step 3: Place the order ────────────────────
      await api.post('/orders', {
        Items,
        addressId,
        deliveryFee,
      });

      // ── Step 4: Redirect to orders page ────────────
      router.push('/orders');
    } catch (err) {
      console.error('Failed to place order:', err);
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── LOADING STATE ─────────────────────────────────
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

  // ── EMPTY CART ────────────────────────────────────
  if (cartItems.length === 0 && !loadingCart) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl block mb-4">🛒</span>
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

  // ── MAIN RENDER ───────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── PAGE HEADER ─────────────────────────── */}
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-[#E85D26]">Checkout</span>
        </h1>
        <p className="text-gray-400 mb-8">Review your order and enter shipping details.</p>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ═══════════════════════════════════════════
              LEFT COLUMN — Cart Review + Address Form
              ═══════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── SECTION 1: ORDER ITEMS ────────────── */}
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

            {/* ── SECTION 2: SHIPPING ADDRESS ──────── */}
            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Shipping Address
              </h2>

              {/* Saved addresses (if any) */}
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

                  {/* Option: Enter new address */}
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

              {/* New address form — shown when 'new' is selected or no saved addresses */}
              {selectedAddressId === 'new' && (
                <div className="space-y-4">
                  {/* House / Apt */}
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

                  {/* Street / Road */}
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

                  {/* City + Zip Code (side by side) */}
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
          </div>

          {/* ═══════════════════════════════════════════
              RIGHT COLUMN — Order Summary + Place Order
              ═══════════════════════════════════════════ */}
          <div>
            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Summary
              </h2>

              {/* Line items */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal ({cartItems.length} items)</span>
                  <span className="text-gray-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery Fee</span>
                  <span className="text-gray-200">${deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-[#2A2A2A] pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-2xl font-bold text-[#E85D26]">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Place Order button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full py-3 px-4 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>

              {/* Back to cart link */}
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
