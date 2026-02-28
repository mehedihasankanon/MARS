'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * =====================================================================
 * PRODUCTS PAGE — /products
 * =====================================================================
 *
 * PURPOSE: Display all products from the database in a browsable grid.
 *          This is the main "shop" page where users discover items to buy.
 *
 * HOW IT WORKS:
 * 1. When the page loads, useEffect() fires automatically
 * 2. It calls GET /api/products on our Express backend
 * 3. Backend queries PostgreSQL: SELECT * FROM Products JOIN Categories...
 * 4. Returns an array of product objects
 * 5. We store them in state and render a card grid
 *
 * FEATURES:
 * - Search bar: filters products by name (client-side filtering)
 * - Category filter: filters by category_name
 * - Loading skeleton: shows placeholder cards while data loads
 * - Empty state: friendly message when no products match
 * - Responsive grid: 1 col mobile → 2 cols tablet → 3 cols desktop
 *
 * BACKEND ENDPOINT: GET /api/products (public, no auth required)
 * RESPONSE FORMAT:  Array of objects, each with:
 *   { product_id, name, description, unit_price, stock_quantity,
 *     condition_state, category_name, seller_name, adding_date }
 *
 * STATE VARIABLES:
 * - products:        full list of products from the API
 * - filteredProducts: products after search/category filtering
 * - searchQuery:     what the user typed in the search bar
 * - selectedCategory: currently selected category filter (or "All")
 * - categories:      unique list of category names (derived from products)
 * - loading:         true while fetching data from the API
 * - error:           error message if the API call fails
 * =====================================================================
 */
export default function ProductsPage() {
  // ── STATE ────────────────────────────────────────────────
  const [products, setProducts] = useState([]);           // All products from API
  const [filteredProducts, setFilteredProducts] = useState([]); // After filtering
  const [searchQuery, setSearchQuery] = useState('');      // Search input value
  const [selectedCategory, setSelectedCategory] = useState('All'); // Category filter
  const [categories, setCategories] = useState([]);        // Unique category list
  const [loading, setLoading] = useState(true);            // Loading state
  const [error, setError] = useState('');                  // Error message

  /**
   * ── FETCH PRODUCTS ON PAGE LOAD ──────────────────────────
   *
   * useEffect with [] dependency = runs ONCE when page first renders.
   * This is the React equivalent of "on page load, fetch data".
   *
   * FLOW:
   *   Page renders → useEffect fires → api.get("/products")
   *   → Express backend → PostgreSQL query → JSON response
   *   → setProducts(data) → page re-renders with product cards
   */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const data = res.data;

        setProducts(data);
        setFilteredProducts(data);

        // Extract unique category names from the product list
        // new Set() removes duplicates, [...set] converts back to array
        const uniqueCategories = [...new Set(data.map(p => p.category_name))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /**
   * ── FILTER PRODUCTS WHEN SEARCH OR CATEGORY CHANGES ──────
   *
   * useEffect with [searchQuery, selectedCategory, products] dependencies
   * = runs every time any of those values change.
   *
   * This is CLIENT-SIDE filtering — we already have all products in memory,
   * so we just filter the array instead of making another API call.
   * This makes searching feel instant (no network delay).
   *
   * FILTERING LOGIC:
   * 1. Start with ALL products
   * 2. If a category is selected (not "All"), keep only matching ones
   * 3. If search text exists, keep only products whose name matches
   */
  useEffect(() => {
    let result = products;

    // Filter by category (if not "All")
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category_name === selectedCategory);
    }

    // Filter by search query (case-insensitive partial match)
    if (searchQuery.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, products]);

  // ── LOADING STATE: Show skeleton placeholder cards ─────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Products</h1>
          {/* Skeleton grid — 6 pulsing placeholder cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                {/* Image placeholder */}
                <div className="w-full h-48 bg-[#1A1A1A] rounded-lg mb-4" />
                {/* Title placeholder */}
                <div className="h-5 bg-[#1A1A1A] rounded w-3/4 mb-3" />
                {/* Price placeholder */}
                <div className="h-4 bg-[#1A1A1A] rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ───────────────────────────────────────────
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

  // ── MAIN RENDER ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Browse <span className="text-[#E85D26]">Products</span>
          </h1>
          <p className="text-gray-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* ── SEARCH & FILTER BAR ──────────────────────────────
             Row with two controls:
             1. Text search input (searches product names)
             2. Category dropdown (filters by category)
             
             On mobile: stacked vertically (flex-col)
             On desktop: side by side (sm:flex-row)
             ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1">
            {/* Search icon (magnifying glass SVG) */}
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors"
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* ── PRODUCT GRID ──────────────────────────────────────
             Responsive grid of product cards.
             - Mobile:  1 column  (default)
             - Tablet:  2 columns (sm:grid-cols-2)
             - Desktop: 3 columns (lg:grid-cols-3)
             
             Each card is a <Link> that navigates to /products/[id]
             ──────────────────────────────────────────────────── */}
        {filteredProducts.length === 0 ? (
          /* ── EMPTY STATE — No products match the filter ─── */
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">No products found</p>
            <p className="text-gray-600 text-sm">
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              /* ── PRODUCT CARD ──────────────────────────────
                 Each card links to the product detail page.
                 Structure:
                   [Image Placeholder]
                   [Category Badge]
                   [Product Name]
                   [Price]        [Stock Status]
                   [Seller Name]
                 ───────────────────────────────────────────── */
              <Link
                key={product.product_id}
                href={`/products/${product.product_id}`}
                className="group bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#E85D26]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#E85D26]/5"
              >
                {/* Product Image Placeholder — colored gradient based on name */}
                <div className="w-full h-48 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center">
                  <span className="text-5xl opacity-30">📦</span>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  {/* Category badge — small orange-tinted label */}
                  <span className="inline-block px-2.5 py-1 text-xs font-medium text-[#E85D26] bg-[#E85D26]/10 rounded-full mb-3">
                    {product.category_name}
                  </span>

                  {/* Product name — truncated to 2 lines max */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#E85D26] transition-colors line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Description preview (first 80 chars) */}
                  {product.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Price + Stock Row */}
                  <div className="flex items-center justify-between mt-auto">
                    {/* Price — large orange text */}
                    <span className="text-xl font-bold text-[#E85D26]">
                      ${parseFloat(product.unit_price).toFixed(2)}
                    </span>

                    {/* Stock status badge */}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.stock_quantity > 0
                        ? 'text-green-400 bg-green-400/10'   // In stock = green
                        : 'text-red-400 bg-red-400/10'       // Out of stock = red
                    }`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  {/* Seller info — shows who is selling this item */}
                  <p className="text-gray-600 text-xs mt-3">
                    Sold by <span className="text-gray-400">{product.seller_name}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
