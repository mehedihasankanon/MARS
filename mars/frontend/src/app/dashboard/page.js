'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('products'); 

  const [allProducts, setAllProducts] = useState([]);       
  const [myProducts, setMyProducts] = useState([]);         
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    unitPrice: '',
    stockQuantity: '',
    conditionState: 'New',     
    categoryId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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

        const mine = all.filter(
          (p) => p.seller_name === user.username
        );
        setMyProducts(mine);

        const catList = catRes.data.map((c) => ({
          id: c.category_id,
          name: c.name,
        }));
        setCategories(catList);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

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

      const res = await api.get('/products');
      setAllProducts(res.data);
      setMyProducts(res.data.filter((p) => p.seller_name === user.username));

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85D26] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Seller <span className="text-[#E85D26]">Dashboard</span>
          </h1>
          <p className="text-gray-400">
            Welcome back, <span className="text-[#F59E0B]">{user.username}</span>. Manage your product listings below.
          </p>
        </div>

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

        {activeTab === 'products' && (
          <>
            {loadingProducts ? (

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

              <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <span className="text-6xl block mb-4"></span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProducts.map((product) => (
                  <Link
                    key={product.product_id}
                    href={`/products/${product.product_id}`}
                    className="group bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#E85D26]/50 transition-all"
                  >

                    <h3 className="text-lg font-semibold text-white group-hover:text-[#E85D26] transition-colors mb-1 truncate">
                      {product.name}
                    </h3>

                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#E85D26]/10 text-[#E85D26] mb-3">
                      {product.category_name}
                    </span>

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

        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Create New <span className="text-[#E85D26]">Listing</span>
            </h2>

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
