'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * =====================================================================
 * SELLER DASHBOARD — /dashboard
 * =====================================================================
 *
 * PURPOSE: Provides sellers with a management interface for their
 *          product listings. Sellers can view their current products
 *          and create new ones.
 *
 * WHO CAN ACCESS: Only users with role="seller" or role="admin"
 *
 * LAYOUT: Two-tab interface
 *   Tab 1 — "My Products":  lists products the seller has posted
 *   Tab 2 — "Add Product":  form to create a new product listing
 *
 * DATA FLOW — My Products:
 *   1. GET /api/products (fetches ALL products with seller_name)
 *   2. Client-side filter: keep only products where seller_name
 *      matches the logged-in user's username
 *   3. Display in a responsive card grid
 *
 * DATA FLOW — Add Product:
 *   1. User fills form: name, description, price, stock, condition, category
 *   2. POST /api/products (requires JWT + seller/admin role)
 *   3. Backend: INSERT INTO Products ... RETURNING *
 *   4. On success: clear form + switch to "My Products" tab + refetch
 *
 * BACKEND ENDPOINTS USED:
 *   GET  /api/products   — no auth needed, returns all products
 *   POST /api/products   — requires authenticateToken + authorizeRoles("seller","admin")
 *     Body: { name, description, unitPrice, stockQuantity, conditionState, categoryId }
 *
 * SCHEMA REFERENCE (Products table):
 *   Product_ID     UUID (auto)
 *   Seller_ID      UUID (from JWT: req.user.userId)
 *   Category_ID    UUID (selected by seller)
 *   Name           VARCHAR(100) NOT NULL
 *   Description    TEXT
 *   Unit_Price     DECIMAL(10,2) NOT NULL
 *   Stock_Quantity INT DEFAULT 0
 *   Condition_State VARCHAR(50)
 *   Adding_Date    TIMESTAMP DEFAULT now()
 * =====================================================================
 */
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // ── UI STATE ─────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'add'

  // ── MY PRODUCTS STATE ────────────────────────────────
  const [allProducts, setAllProducts] = useState([]);       // All products from API
  const [myProducts, setMyProducts] = useState([]);         // Filtered to this seller
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ── CATEGORIES LIST (extracted from all products) ────
  const [categories, setCategories] = useState([]);

  // ── ADD PRODUCT FORM STATE ───────────────────────────
  const [form, setForm] = useState({
    name: '',
    description: '',
    unitPrice: '',
    stockQuantity: '',
    conditionState: 'New',     // Default condition
    categoryId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  /**
   * ── AUTH GUARD ───────────────────────────────────────
   * Only sellers and admins should access this page.
   * Customers are redirected to the home page.
   */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'seller' && user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, authLoading]);

  /**
   * ── FETCH ALL PRODUCTS + CATEGORIES ─────────────────
   * GET /api/products returns all products with seller_name.
   * GET /api/categories returns all categories from the DB.
   * We filter products client-side to find "my" products.
   */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
        ]);

        const all = prodRes.data;
        setAllProducts(all);

        // Filter products belonging to this seller
        const mine = all.filter(
          (p) => p.seller_name === user.username
        );
        setMyProducts(mine);

        // Use categories from the dedicated endpoint
        const catList = catRes.data.map((c) => ({
          id: c.category_id,
          name: c.name,
        }));
        setCategories(catList);

        // Pre-select first category if available
        if (catList.length > 0 && !form.categoryId) {
          setForm((prev) => ({ ...prev, categoryId: catList[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, [user]);

  /**
   * ── FORM CHANGE HANDLER ─────────────────────────────
   * Generic handler for all form inputs.
   * Uses the input's `name` attribute as the state key.
   *
   * e.target.name  → which field changed (e.g. "name", "unitPrice")
   * e.target.value → new value typed by user
   */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * ── FORM SUBMIT — CREATE PRODUCT ───────────────────
   * Validates required fields, then sends POST /api/products.
   * On success: clears form, refetches product list, switches tab.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // ── Client-side validation ────────────────────────
    if (!form.name || !form.unitPrice || !form.categoryId) {
      setFormError('Name, price, and category are required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description,
        unitPrice: parseFloat(form.unitPrice),
        stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        conditionState: form.conditionState,
        categoryId: form.categoryId,
      });

      setFormSuccess('Product created successfully!');
      setForm({
        name: '',
        description: '',
        unitPrice: '',
        stockQuantity: '',
        conditionState: 'New',
        categoryId: categories[0]?.id || '',
      });

      // Refetch to update the "My Products" tab
      const res = await api.get('/products');
      setAllProducts(res.data);
      setMyProducts(res.data.filter((p) => p.seller_name === user.username));

      // Switch to "My Products" after a short delay
      setTimeout(() => {
        setActiveTab('products');
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Failed to create product:', err);
      setFormError(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOADING / AUTH GUARD RENDER ────────────────────
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85D26] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── MAIN RENDER ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* ── PAGE HEADER ────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Seller <span className="text-[#E85D26]">Dashboard</span>
          </h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-[#F59E0B]">{user.username}</span>. Manage your product listings below.
          </p>
        </div>

        {/* ── TAB BAR ────────────────────────────────── 
             Two tabs: "My Products" and "Add Product"
             Active tab gets orange underline + text ──── */}
        <div className="flex border-b border-[#2A2A2A] mb-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'products'
                ? 'text-[#E85D26]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            My Products ({myProducts.length})
            {activeTab === 'products' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'add'
                ? 'text-[#E85D26]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            + Add Product
            {activeTab === 'add' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26]" />
            )}
          </button>
        </div>

        {/* ═══════════════════════════════════════════════
            TAB 1: MY PRODUCTS — Product cards grid
            ═══════════════════════════════════════════════ */}
        {activeTab === 'products' && (
          <>
            {loadingProducts ? (
              /* Loading skeleton — 3 card placeholders */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 animate-pulse">
                    <div className="h-5 bg-[#1A1A1A] rounded w-3/4 mb-3" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/2 mb-2" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : myProducts.length === 0 ? (
              /* Empty state — no products yet */
              <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <span className="text-6xl block mb-4">📦</span>
                <h2 className="text-2xl font-bold text-white mb-2">No products listed</h2>
                <p className="text-gray-400 mb-6">
                  Start selling by adding your first product.
                </p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
                >
                  Add Product
                </button>
              </div>
            ) : (
              /* Product cards grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProducts.map((product) => (
                  <Link
                    key={product.product_id}
                    href={`/products/${product.product_id}`}
                    className="group bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#E85D26]/50 transition-all"
                  >
                    {/* Product name */}
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#E85D26] transition-colors mb-1 truncate">
                      {product.name}
                    </h3>

                    {/* Category badge */}
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#E85D26]/10 text-[#E85D26] mb-3">
                      {product.category_name}
                    </span>

                    {/* Price + Stock row */}
                    <div className="flex justify-between items-center">
                      <p className="text-[#F59E0B] font-bold text-lg">
                        ${parseFloat(product.unit_price).toFixed(2)}
                      </p>
                      <p className={`text-sm ${product.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {product.stock_quantity > 0
                          ? `${product.stock_quantity} in stock`
                          : 'Out of stock'}
                      </p>
                    </div>

                    {/* Condition + Date */}
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      {product.condition_state && (
                        <span>{product.condition_state}</span>
                      )}
                      <span>
                        {product.adding_date
                          ? new Date(product.adding_date).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 2: ADD PRODUCT — New product form
            ═══════════════════════════════════════════════ */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Create New <span className="text-[#E85D26]">Listing</span>
            </h2>

            {/* ── Error / Success banners ─────────────── */}
            {formError && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── Product Name ───────────────────────── */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Wireless Headphones"
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>

              {/* ── Description ────────────────────────── */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your product..."
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent resize-none"
                />
              </div>

              {/* ── Price + Stock (side by side) ─────── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-300 mb-1">
                    Unit Price ($) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="unitPrice"
                    name="unitPrice"
                    value={form.unitPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="29.99"
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-300 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    id="stockQuantity"
                    name="stockQuantity"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    min="0"
                    placeholder="100"
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  />
                </div>
              </div>

              {/* ── Category + Condition (side by side) ─ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="conditionState" className="block text-sm font-medium text-gray-300 mb-1">
                    Condition
                  </label>
                  <select
                    id="conditionState"
                    name="conditionState"
                    value={form.conditionState}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              </div>

              {/* ── Submit button ──────────────────────── */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
