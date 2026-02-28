'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * =====================================================================
 * CART PAGE — /cart
 * =====================================================================
 *
 * PURPOSE: Shows the customer's shopping cart with all added products.
 *          Allows quantity updates, item removal, and checkout.
 *
 * WHO CAN ACCESS: Only logged-in CUSTOMERS (role = "customer").
 *   - Sellers see a message telling them this is for buyers only.
 *   - Logged-out users are redirected to login.
 *
 * DATA FLOW:
 * 1. Page loads → useEffect checks if user is logged in
 * 2. If logged in as customer → GET /api/cart
 * 3. Backend returns: { cart_id, total_amount, items: [...] }
 *    where each item = { product_id, quantity, net_price }
 * 4. For each item, we also fetch product details (name, price)
 *    to display in the cart
 *
 * BACKEND ENDPOINTS USED:
 *   GET    /api/cart                  → get cart contents
 *   PUT    /api/cart/items/:productId → update item quantity
 *   DELETE /api/cart/items/:itemId    → remove item from cart
 *   POST   /api/orders               → place order (checkout)
 *
 * STATE:
 * - cart:          raw cart data from the API
 * - cartItems:     enriched items with product details
 * - loading:       true while fetching cart data
 * - updating:      ID of item currently being updated (prevents double-click)
 * - checkingOut:   true during checkout process
 * =====================================================================
 */
export default function CartPage() {
  // ── HOOKS ──────────────────────────────────────────────
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── STATE ──────────────────────────────────────────────
  const [cart, setCart] = useState(null);          // Raw cart from API
  const [cartItems, setCartItems] = useState([]);  // Enriched with product names
  const [loading, setLoading] = useState(true);    // Data loading state
  const [updating, setUpdating] = useState(null);  // Product ID being updated
  const [error, setError] = useState('');           // Error message

  /**
   * ── FETCH CART DATA ──────────────────────────────────
   *
   * Waits for auth to finish loading, then:
   * 1. If not logged in → redirect to login
   * 2. If logged in → fetch cart from API
   * 3. For each cart item, fetch product details
   *    (because the cart API only returns product_id + quantity,
   *     we need the product name and price for display)
   */
  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete

    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchCart();
  }, [user, authLoading]);

  /**
   * fetchCart — Loads cart data and enriches items with product info.
   *
   * ENRICHMENT PROCESS:
   *   Cart API returns: { product_id: "abc", quantity: 2, net_price: 50 }
   *   We need to show: "Product Name" and the unit price.
   *   So we call GET /api/products/:id for each item.
   *   This is done in parallel using Promise.all() for speed.
   */
  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      const cartData = res.data;
      setCart(cartData);

      if (cartData.items && cartData.items.length > 0) {
        // Fetch product details for each cart item IN PARALLEL
        const enrichedItems = await Promise.all(
          cartData.items.map(async (item) => {
            try {
              const productRes = await api.get(`/products/${item.product_id}`);
              return {
                ...item,
                product: productRes.data, // Full product object
              };
            } catch {
              return {
                ...item,
                product: { name: 'Unknown Product', unit_price: 0 },
              };
            }
          })
        );
        setCartItems(enrichedItems);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError('Failed to load your cart.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ── UPDATE ITEM QUANTITY ──────────────────────────────
   *
   * Called when user clicks + or − on a cart item.
   * Sends PUT /api/cart/items/:productId with new quantity.
   * Then refreshes the entire cart to get updated totals.
   */
  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return; // Don't allow 0 or negative

    setUpdating(productId);
    try {
      await api.put(`/cart/items/${productId}`, { quantity: newQuantity });
      await fetchCart(); // Refresh cart data
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(null);
    }
  };

  /**
   * ── REMOVE ITEM FROM CART ─────────────────────────────
   *
   * Called when user clicks the "Remove" button on a cart item.
   * Sends DELETE /api/cart/items/:itemId.
   * Then refreshes the cart.
   */
  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId);
    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart(); // Refresh cart data
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdating(null);
    }
  };

  /**
   * ── CALCULATE TOTAL ────────────────────────────────────
   *
   * Sums up all item net_prices to get the cart total.
   * net_price = unit_price × quantity (calculated by the backend).
   */
  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.net_price || 0);
  }, 0);

  // ── AUTH LOADING STATE ─────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Shopping Cart</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-[#1A1A1A] rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-[#1A1A1A] rounded w-2/3" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/4" />
                  </div>
                </div>
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
            onClick={() => { setError(''); fetchCart(); }}
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
          Shopping <span className="text-[#E85D26]">Cart</span>
        </h1>
        <p className="text-gray-400 mb-8">
          {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
        </p>

        {/* ── EMPTY CART STATE ─────────────────────────── */}
        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-6xl block mb-4">🛒</span>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Start browsing products to add items to your cart.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* ── CART WITH ITEMS ──────────────────────────── 
             Two-section layout:
             - Left (wide):  List of cart items
             - Right (narrow): Order summary with checkout button
             On mobile: stacked. On desktop: side by side.
             ──────────────────────────────────────────── */
          <div className="grid lg:grid-cols-3 gap-8">

            {/* ── CART ITEMS LIST (spans 2 of 3 columns) ── */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                /* ── SINGLE CART ITEM ROW ────────────────
                   Layout: [Image] [Name + Price] [Qty Controls] [Remove]
                   ─────────────────────────────────────── */
                <div
                  key={item.product_id}
                  className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  {/* Product image placeholder */}
                  <div className="w-20 h-20 bg-[#1A1A1A] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl opacity-30">📦</span>
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-white font-medium hover:text-[#E85D26] transition-colors truncate block"
                    >
                      {item.product?.name || 'Product'}
                    </Link>
                    <p className="text-[#E85D26] font-semibold mt-1">
                      ${parseFloat(item.product?.unit_price || 0).toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center border border-[#2A2A2A] rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      disabled={updating === item.product_id || item.quantity <= 1}
                      className="px-3 py-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="px-3 py-2 text-white text-sm min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      disabled={updating === item.product_id}
                      className="px-3 py-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  {/* Item total + remove button */}
                  <div className="text-right flex sm:flex-col items-center sm:items-end gap-3">
                    <span className="text-white font-semibold">
                      ${parseFloat(item.net_price || 0).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      disabled={updating === item.product_id}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── ORDER SUMMARY SIDEBAR ───────────────────
                 Sticky on desktop so it stays visible while
                 scrolling through a long cart.
                 Shows subtotal and checkout button.
                 ──────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>

                {/* Subtotal row */}
                <div className="flex justify-between text-gray-400 mb-2">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>

                {/* Shipping estimate */}
                <div className="flex justify-between text-gray-400 mb-4">
                  <span>Shipping</span>
                  <span className="text-gray-500 text-sm">Calculated at checkout</span>
                </div>

                {/* Divider line */}
                <div className="border-t border-[#2A2A2A] pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-[#E85D26] font-bold text-lg">${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout button — links to checkout page */}
                <Link
                  href="/checkout"
                  className="block w-full py-3 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] transition-colors text-center shadow-lg shadow-[#E85D26]/20"
                >
                  Proceed to Checkout
                </Link>

                {/* Continue shopping link */}
                <Link
                  href="/products"
                  className="block w-full py-3 mt-3 text-gray-400 hover:text-white text-center text-sm transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
