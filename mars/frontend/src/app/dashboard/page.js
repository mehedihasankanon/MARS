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
  const [imageFiles, setImageFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [sellerOrders, setSellerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const [imageModalProduct, setImageModalProduct] = useState(null);
  const [imageModalImages, setImageModalImages] = useState([]);
  const [imageModalLoading, setImageModalLoading] = useState(false);
  const [imageModalUploading, setImageModalUploading] = useState(false);
  const [imageModalDeleting, setImageModalDeleting] = useState(null);

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
        const [prodRes, catRes, ordersRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/orders/seller-orders'),
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

        setSellerOrders(ordersRes.data);

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

  useEffect(() => {
    if (!user || activeTab !== 'orders') return;

    const fetchSellerOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await api.get('/orders/seller-orders');
        setSellerOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch seller orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchSellerOrders();
  }, [user, activeTab]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setSellerOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, order_status: newStatus } : o
        )
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const openImageModal = async (product) => {
    setImageModalProduct(product);
    setImageModalImages(product.images || []);
  };

  const closeImageModal = () => {
    setImageModalProduct(null);
    setImageModalImages([]);
    setImageModalDeleting(null);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';

    const remaining = 5 - imageModalImages.length;
    if (remaining <= 0) return;
    const toUpload = files.slice(0, remaining);

    setImageModalUploading(true);
    try {
      const formData = new FormData();
      toUpload.forEach((file) => formData.append('images', file));
      const res = await api.post(`/products/${imageModalProduct.product_id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageModalImages((prev) => [...prev, ...res.data.images]);
      const prodRes = await api.get('/products');
      setAllProducts(prodRes.data);
      setMyProducts(prodRes.data.filter((p) => p.seller_name === user.username));
    } catch (err) {
      console.error('Failed to upload images:', err);
    } finally {
      setImageModalUploading(false);
    }
  };

  const handleImageDelete = async (imageId) => {
    setImageModalDeleting(imageId);
    try {
      await api.delete(`/products/${imageModalProduct.product_id}/images/${imageId}`);
      setImageModalImages((prev) => prev.filter((img) => img.image_id !== imageId));
      const prodRes = await api.get('/products');
      setAllProducts(prodRes.data);
      setMyProducts(prodRes.data.filter((p) => p.seller_name === user.username));
    } catch (err) {
      console.error('Failed to delete image:', err);
    } finally {
      setImageModalDeleting(null);
    }
  };

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
      const productRes = await api.post('/products', {
        name: form.name,
        description: form.description,
        unitPrice: parseFloat(form.unitPrice),
        stockQuantity: parseInt(form.stockQuantity, 10) || 0,
        conditionState: form.conditionState,
        categoryId: form.categoryId,
      });

      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file) => formData.append('images', file));
        await api.post(`/products/${productRes.data.product_id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setFormSuccess('Product created successfully!');
      setForm({
        name: '',
        description: '',
        unitPrice: '',
        stockQuantity: '',
        conditionState: 'New',
        categoryId: categories[0]?.id || '',
      });
      setImageFiles([]);

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
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'orders'
                ? 'text-[#E85D26]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Orders
            {sellerOrders.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-[#E85D26]/20 text-[#E85D26] rounded-full">
                {sellerOrders.length}
              </span>
            )}
            {activeTab === 'orders' && (
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
                  <div
                    key={product.product_id}
                    className="group bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#E85D26]/50 transition-all"
                  >

                    {product.images && product.images.length > 0 && product.images[0].image_url ? (
                      <div className="w-full h-36 mb-3 rounded-lg overflow-hidden relative">
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => openImageModal(product)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-opacity opacity-0 group-hover:opacity-100"
                          title="Manage images"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openImageModal(product)}
                        className="w-full h-36 mb-3 rounded-lg border-2 border-dashed border-[#2A2A2A] hover:border-[#E85D26]/40 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-[#E85D26]"
                      >
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Add Images</span>
                      </button>
                    )}

                    <Link href={`/products/${product.product_id}`}>
                      <h3 className="text-lg font-semibold text-white hover:text-[#E85D26] transition-colors mb-1 truncate">
                        {product.name}
                      </h3>
                    </Link>

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
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <>
            {loadingOrders ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                    <div className="h-5 bg-[#1A1A1A] rounded w-1/3 mb-3" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/2 mb-2" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : sellerOrders.length === 0 ? (
              <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <span className="text-6xl block mb-4">📦</span>
                <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
                <p className="text-gray-400">
                  When customers order your products, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerOrders.map((order) => {
                  const statusColors = {
                    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                    Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    Shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    Delivered: 'bg-green-500/10 text-green-400 border-green-500/30',
                    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
                  };
                  const statusClass = statusColors[order.order_status] || statusColors.Pending;

                  return (
                    <div
                      key={order.order_id}
                      className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 hover:border-[#E85D26]/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Order #{order.order_id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {new Date(order.order_date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusClass}`}>
                            {order.order_status}
                          </span>
                          <select
                            value={order.order_status}
                            onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                            disabled={updatingOrder === order.order_id}
                            className="px-3 py-1.5 text-xs bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E85D26] disabled:opacity-50"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <span className="text-gray-400">Customer:</span>
                        <span className="text-white font-medium">{order.customer_name}</span>
                        {order.payment_method && (
                          <span className="ml-3 text-gray-500">• {order.payment_method}</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-2 px-3 bg-[#0A0A0A] rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/products/${item.product_id}`}
                                className="text-sm text-white hover:text-[#E85D26] transition-colors"
                              >
                                {item.product_name}
                              </Link>
                              <span className="text-xs text-gray-500">× {item.quantity}</span>
                            </div>
                            <span className="text-sm text-[#F59E0B] font-medium">
                              ${parseFloat(item.net_price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1A1A1A] flex justify-end">
                        <p className="text-lg font-bold text-white">
                          Total: <span className="text-[#F59E0B]">${parseFloat(order.total_amount).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Product Images <span className="text-gray-500">(up to 5)</span>
                </label>
                <div className="border-2 border-dashed border-[#2A2A2A] rounded-lg p-4 hover:border-[#E85D26]/40 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImageFiles((prev) => [...prev, ...files].slice(0, 5));
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="product-images"
                  />
                  <label
                    htmlFor="product-images"
                    className="flex flex-col items-center cursor-pointer py-2"
                  >
                    <svg className="w-8 h-8 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-400">Click to select images</span>
                    <span className="text-xs text-gray-600 mt-1">JPG, PNG, WebP — max 5MB each</span>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative group/img">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-[#2A2A2A]"
                        />
                        <button
                          type="button"
                          onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

        {imageModalProduct && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeImageModal}>
            <div
              className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">
                  Manage Images — <span className="text-[#E85D26]">{imageModalProduct.name}</span>
                </h3>
                <button onClick={closeImageModal} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {imageModalImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {imageModalImages.map((img) => (
                    <div key={img.image_id} className="relative group/img rounded-lg overflow-hidden border border-[#2A2A2A]">
                      <img src={img.image_url} alt="" className="w-full h-24 object-cover" />
                      <button
                        onClick={() => handleImageDelete(img.image_id)}
                        disabled={imageModalDeleting === img.image_id}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 rounded-full transition-opacity opacity-0 group-hover/img:opacity-100 disabled:opacity-50"
                      >
                        {imageModalDeleting === img.image_id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-5">No images yet. Upload some below.</p>
              )}

              {imageModalImages.length < 5 && (
                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="modal-image-upload"
                  />
                  <label
                    htmlFor="modal-image-upload"
                    className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-[#2A2A2A] hover:border-[#E85D26]/40 rounded-lg cursor-pointer transition-colors ${
                      imageModalUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {imageModalUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#E85D26] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-400">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm text-gray-400">
                          Add images ({imageModalImages.length}/5)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
