'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * =====================================================================
 * PRODUCT DETAIL PAGE — /products/[id]
 * =====================================================================
 *
 * PURPOSE: Shows full details of a single product and lets
 *          logged-in customers add it to their shopping cart.
 *
 * HOW NEXT.JS DYNAMIC ROUTING WORKS:
 *   This file is at: app/products/[id]/page.js
 *   The [id] folder name means this is a DYNAMIC ROUTE.
 *   Visiting /products/abc-123 → id = "abc-123"
 *   We read the id with useParams() hook.
 *
 * DATA FLOW:
 * 1. Page loads → useParams() gives us the product UUID
 * 2. useEffect fetches GET /api/products/:id from Express
 * 3. Express queries: SELECT * FROM Products WHERE Product_ID = $1
 * 4. We display the product details
 * 5. User clicks "Add to Cart" → POST /api/cart/items
 *    (requires login — sends JWT token automatically via api.js)
 *
 * BACKEND ENDPOINTS USED:
 *   GET  /api/products/:id        → fetch product details (public)
 *   POST /api/cart/items           → add to cart (customer only)
 *     Body: { product_id, quantity }
 *
 * STATE:
 * - product:     the product object from the API
 * - quantity:    how many the user wants to add (default: 1)
 * - loading:     true while fetching product data
 * - addingToCart: true while the "add to cart" request is in flight
 * - cartMessage: success/error message after cart action
 * =====================================================================
 */
export default function ProductDetailPage() {
  // ── HOOKS ──────────────────────────────────────────────
  const params = useParams();         // { id: "product-uuid-here" }
  const router = useRouter();         // For programmatic navigation
  const { user } = useAuth();         // Current logged-in user (or null)

  // ── STATE ──────────────────────────────────────────────
  const [product, setProduct] = useState(null);       // Product data
  const [quantity, setQuantity] = useState(1);         // Quantity selector
  const [loading, setLoading] = useState(true);        // Loading state
  const [addingToCart, setAddingToCart] = useState(false); // Cart button state
  const [cartMessage, setCartMessage] = useState({ type: '', text: '' }); // Feedback

  /**
   * ── FETCH PRODUCT DATA ON PAGE LOAD ──────────────────
   *
   * params.id comes from the URL: /products/[id]
   * We fetch the specific product from the backend.
   * If the product doesn't exist (404), we show an error.
   */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${params.id}`);
        setProduct(res.data);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  /**
   * ── ADD TO CART HANDLER ──────────────────────────────
   *
   * Sends POST /api/cart/items with { product_id, quantity }.
   * The api.js interceptor automatically attaches the JWT token.
   * Backend creates or updates the cart item in PostgreSQL.
   *
   * GUARD: If user is not logged in, redirect to login page.
   * GUARD: If user is a seller (not customer), show an error.
   */
  const handleAddToCart = async () => {
    // Not logged in → send to login page
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setAddingToCart(true);
    setCartMessage({ type: '', text: '' });

    try {
      await api.post('/cart/items', {
        product_id: product.product_id,
        quantity: quantity,
      });
      setCartMessage({
        type: 'success',
        text: `Added ${quantity} item${quantity > 1 ? 's' : ''} to your cart!`,
      });
    } catch (err) {
      setCartMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add to cart. Make sure you are logged in as a customer.',
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // ── LOADING STATE ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 animate-pulse">
            <div className="w-full h-96 bg-[#111111] rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-[#111111] rounded w-3/4" />
              <div className="h-5 bg-[#111111] rounded w-1/3" />
              <div className="h-24 bg-[#111111] rounded" />
              <div className="h-12 bg-[#111111] rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PRODUCT NOT FOUND STATE ────────────────────────────
  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Product Not Found</h2>
          <p className="text-gray-400 mb-6">This product may have been removed or doesn&apos;t exist.</p>
          <Link
            href="/products"
            className="px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // ── DERIVED VALUES ─────────────────────────────────────
  const inStock = product.stock_quantity > 0;
  const formattedPrice = parseFloat(product.unit_price).toFixed(2);

  // ── MAIN RENDER ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── BREADCRUMB NAVIGATION ──────────────────────
             Shows: Products > Product Name
             Helps users navigate back to the products list.
             ───────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/products" className="hover:text-[#E85D26] transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-300 truncate">{product.name}</span>
        </nav>

        {/* ── PRODUCT LAYOUT: Image (left) + Details (right) ──
             Two-column grid on desktop, stacked on mobile.
             ──────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-10">

          {/* ── LEFT COLUMN: Product Image ────────────── */}
          <div className="w-full h-80 md:h-96 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-center">
            <span className="text-8xl opacity-20">📦</span>
          </div>

          {/* ── RIGHT COLUMN: Product Info ────────────── */}
          <div className="flex flex-col">

            {/* Category badge */}
            <span className="inline-block w-fit px-3 py-1 text-xs font-medium text-[#E85D26] bg-[#E85D26]/10 rounded-full mb-3">
              {product.category_name}
            </span>

            {/* Product name */}
            <h1 className="text-3xl font-bold text-white mb-2">
              {product.name}
            </h1>

            {/* Seller info */}
            <p className="text-gray-500 text-sm mb-4">
              Sold by <span className="text-gray-300">{product.seller_name}</span>
            </p>

            {/* Price — large and prominent */}
            <p className="text-4xl font-bold text-[#E85D26] mb-6">
              ${formattedPrice}
            </p>

            {/* Description paragraph */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
                <p className="text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product meta info — condition & stock */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Condition */}
              {product.condition_state && (
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Condition</p>
                  <p className="text-sm text-white font-medium">{product.condition_state}</p>
                </div>
              )}
              {/* Stock */}
              <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Availability</p>
                <p className={`text-sm font-medium ${inStock ? 'text-green-400' : 'text-red-400'}`}>
                  {inStock ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </p>
              </div>
            </div>

            {/* ── ADD TO CART SECTION ─────────────────────
                 Quantity selector + Add to Cart button.
                 Only enabled if product is in stock.
                 ──────────────────────────────────────── */}
            {inStock && (
              <div className="flex items-center gap-4 mb-4">
                {/* Quantity Selector — minus / number / plus buttons */}
                <div className="flex items-center border border-[#2A2A2A] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-3 text-white min-w-[48px] text-center bg-[#111111]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 py-3 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#E85D26]/20"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Out of stock message */}
            {!inStock && (
              <div className="py-3 px-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm text-center">
                This product is currently out of stock.
              </div>
            )}

            {/* ── CART FEEDBACK MESSAGE ────────────────────
                 Shows success (green) or error (red) after 
                 the user tries to add an item to cart.
                 ──────────────────────────────────────── */}
            {cartMessage.text && (
              <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${
                cartMessage.type === 'success'
                  ? 'bg-green-900/20 border border-green-800 text-green-400'
                  : 'bg-red-900/20 border border-red-800 text-red-400'
              }`}>
                {cartMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
