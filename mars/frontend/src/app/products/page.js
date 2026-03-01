'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ProductsPage() {

  const [products, setProducts] = useState([]);           
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const [searchQuery, setSearchQuery] = useState('');      
  const [selectedCategory, setSelectedCategory] = useState('All'); 
  const [categories, setCategories] = useState([]);        
  const [loading, setLoading] = useState(true);            
  const [error, setError] = useState('');                  

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const data = res.data;

        setProducts(data);
        setFilteredProducts(data);

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

  useEffect(() => {
    let result = products;

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category_name === selectedCategory);
    }

    if (searchQuery.trim()) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Products</h1>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">

                <div className="w-full h-48 bg-[#1A1A1A] rounded-lg mb-4" />

                <div className="h-5 bg-[#1A1A1A] rounded w-3/4 mb-3" />

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
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Browse <span className="text-[#E85D26]">Products</span>
          </h1>
          <p className="text-gray-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">

          <div className="relative flex-1">

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

        {filteredProducts.length === 0 ? (

          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">No products found</p>
            <p className="text-gray-600 text-sm">
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (

              <Link
                key={product.product_id}
                href={`/products/${product.product_id}`}
                className="group bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#E85D26]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#E85D26]/5"
              >

                <div className="w-full h-48 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center">
                  <span className="text-5xl opacity-30"></span>
                </div>

                <div className="p-5">

                  <span className="inline-block px-2.5 py-1 text-xs font-medium text-[#E85D26] bg-[#E85D26]/10 rounded-full mb-3">
                    {product.category_name}
                  </span>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#E85D26] transition-colors line-clamp-2">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto">

                    <span className="text-xl font-bold text-[#E85D26]">
                      ${parseFloat(product.unit_price).toFixed(2)}
                    </span>

                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.stock_quantity > 0
                        ? 'text-green-400 bg-green-400/10'   // In stock = green
                        : 'text-red-400 bg-red-400/10'       // Out of stock = red
                    }`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>

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
