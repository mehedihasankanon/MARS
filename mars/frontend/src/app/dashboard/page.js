'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState('products'); 
  const tabParam = searchParams.get('tab');
  const orderParam = searchParams.get('order');

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
  const [deliveryIssues, setDeliveryIssues] = useState([]);
  const [loadingDeliveryIssues, setLoadingDeliveryIssues] = useState(false);

  const [sellerReturns, setSellerReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [approvingReturn, setApprovingReturn] = useState(null);

  const [sellerStats, setSellerStats] = useState(null);
  const [loadingSellerStats, setLoadingSellerStats] = useState(false);


  const [imageModalProduct, setImageModalProduct] = useState(null);
  const [imageModalImages, setImageModalImages] = useState([]);
  const [imageModalLoading, setImageModalLoading] = useState(false);
  const [imageModalUploading, setImageModalUploading] = useState(false);
  const [imageModalDeleting, setImageModalDeleting] = useState(null);

  const [editModalProduct, setEditModalProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    unitPrice: '',
    stockQuantity: '',
    conditionState: '',
    categoryId: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [editFormSuccess, setEditFormSuccess] = useState('');

  const [productStockFilter, setProductStockFilter] = useState('all');
  const [productSort, setProductSort] = useState('newest');

  const [offerModalProduct, setOfferModalProduct] = useState(null);
  const [productOffers, setProductOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({
    offerPercent: '10',
    startDate: '',
    expiryDate: '',
  });
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');

  const filteredMyProducts = useMemo(() => {
    let list = [...myProducts];
    if (productStockFilter === 'in_stock') {
      list = list.filter((p) => (Number(p.stock_quantity) || 0) > 0);
    } else if (productStockFilter === 'out_of_stock') {
      list = list.filter((p) => (Number(p.stock_quantity) || 0) <= 0);
    }

    const num = (v) => Number(v) || 0;

    switch (productSort) {
      case 'popular':
        list.sort((a, b) => num(b.order_count) - num(a.order_count));
        break;
      case 'rating':
        list.sort((a, b) => num(b.avg_rating) - num(a.avg_rating));
        break;
      case 'price_asc':
        list.sort((a, b) => num(a.unit_price) - num(b.unit_price));
        break;
      case 'price_desc':
        list.sort((a, b) => num(b.unit_price) - num(a.unit_price));
        break;
      case 'newest':
      default:
        list.sort(
          (a, b) =>
            new Date(b.adding_date || 0) - new Date(a.adding_date || 0),
        );
        break;
    }
    return list;
  }, [myProducts, productStockFilter, productSort]);

  const openOfferModal = async (product) => {
    setOfferModalProduct(product);
    setOfferError('');
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const toLocal = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setOfferForm({
      offerPercent: '10',
      startDate: toLocal(now),
      expiryDate: toLocal(weekLater),
    });
    setOfferLoading(true);
    try {
      const res = await api.get(`/offers/product/${product.product_id}`);
      setProductOffers(res.data);
    } catch {
      setProductOffers([]);
    } finally {
      setOfferLoading(false);
    }
  };

  const closeOfferModal = () => {
    setOfferModalProduct(null);
    setProductOffers([]);
    setOfferError('');
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!offerModalProduct) return;
    setOfferSubmitting(true);
    setOfferError('');
    try {
      await api.post('/offers', {
        productId: offerModalProduct.product_id,
        offerPercent: parseFloat(offerForm.offerPercent),
        startDate: new Date(offerForm.startDate).toISOString(),
        expiryDate: new Date(offerForm.expiryDate).toISOString(),
      });
      const res = await api.get(`/offers/product/${offerModalProduct.product_id}`);
      setProductOffers(res.data);
      const prodRes = await api.get('/products');
      setAllProducts(prodRes.data);
      setMyProducts(prodRes.data.filter((p) => p.seller_name === user.username));
    } catch (err) {
      setOfferError(err.response?.data?.error || 'Failed to create offer');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!offerModalProduct) return;
    try {
      await api.delete(`/offers/${offerId}`);
      const res = await api.get(`/offers/product/${offerModalProduct.product_id}`);
      setProductOffers(res.data);
      const prodRes = await api.get('/products');
      setAllProducts(prodRes.data);
      setMyProducts(prodRes.data.filter((p) => p.seller_name === user.username));
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (product) => {
    setEditFormError('');
    setEditFormSuccess('');
    setEditModalProduct(product);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      unitPrice: product.unit_price || '',
      stockQuantity: product.stock_quantity || '',
      conditionState: product.condition_state || 'New',
      categoryId: product.category_id || '',
    });
  };

  const closeEditModal = () => {
    setEditModalProduct(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');
    setEditFormSuccess('');
    setEditSubmitting(true);

    if (!editForm.name || !editForm.unitPrice || editForm.stockQuantity === '') {
      setEditFormError('Name, Price, and Stock are required');
      setEditSubmitting(false);
      return;
    }

    try {
      const res = await api.put(`/products/${editModalProduct.product_id}`, editForm);
      setEditFormSuccess('Product updated successfully!');
      
      const updatedProduct = {
        ...editModalProduct,
        ...res.data,
        unit_price: res.data.unit_price,
        stock_quantity: res.data.stock_quantity,
        condition_state: res.data.condition_state,
        category_name: categories.find(c => c.id === editForm.categoryId)?.name || editModalProduct.category_name
      };
      
      setAllProducts(prev => prev.map(p => p.product_id === editModalProduct.product_id ? updatedProduct : p));
      setMyProducts(prev => prev.map(p => p.product_id === editModalProduct.product_id ? updatedProduct : p));
      
      setTimeout(() => closeEditModal(), 1500);
    } catch (err) {
      console.error(err);
      setEditFormError(err.response?.data?.error || 'Failed to update product');
    } finally {
      setEditSubmitting(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }

    if (user.role !== 'seller') {
      router.push('/');
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || user.role !== 'seller') return;

    const fetchData = async () => {
      try {
        const [prodRes, catRes, ordersRes, issuesRes] = await Promise.all([
          api.get('/products'),
          api.get('/categories'),
          api.get('/orders/seller-orders'),
          api.get('/orders/seller/delivery-issues'),
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
        setDeliveryIssues(issuesRes.data);

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
    if (!tabParam) return;
    const allowedTabs = ['products', 'orders', 'delivery-issues', 'returns', 'sales', 'add'];
    if (allowedTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!user || user.role !== 'seller' || activeTab !== 'orders') return;

    const fetchSellerOrders = async () => {
      setLoadingOrders(true);
      try {
        const ordersRes = await api.get('/orders/seller-orders');
        setSellerOrders(ordersRes.data);
      } catch (err) {
        console.error('Failed to fetch seller orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchSellerOrders();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || user.role !== 'seller' || activeTab !== 'delivery-issues') return;

    const fetchIssues = async () => {
      setLoadingDeliveryIssues(true);
      try {
        const issuesRes = await api.get('/orders/seller/delivery-issues');
        setDeliveryIssues(issuesRes.data);
      } catch (err) {
        console.error('Failed to fetch delivery issues:', err);
      } finally {
        setLoadingDeliveryIssues(false);
      }
    };

    fetchIssues();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || user.role !== 'seller' || activeTab !== 'returns') return;

    const fetchSellerReturns = async () => {
      setLoadingReturns(true);
      try {
        const res = await api.get('/returns/seller');
        setSellerReturns(res.data);
      } catch (err) {
        console.error('Failed to fetch returns:', err);
      } finally {
        setLoadingReturns(false);
      }
    };

    fetchSellerReturns();
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || user.role !== 'seller' || activeTab !== 'sales') return;

    const fetchSellerStats = async () => {
      setLoadingSellerStats(true);
      try {
        const res = await api.get('/analytics/seller-stats');
        setSellerStats(res.data);
      } catch (err) {
        console.error('Failed to fetch seller stats:', err);
      } finally {
        setLoadingSellerStats(false);
      }
    };

    fetchSellerStats();
  }, [user, activeTab]);

  const handleApproveReturn = async (returnId) => {
    setApprovingReturn(returnId);
    try {
      await api.post(`/returns/approve/${returnId}`);
      setSellerReturns(prev => prev.map(r => r.return_id === returnId ? { ...r, status: 'Approved' } : r));
    } catch (err) {
      console.error('Failed to approve return:', err);
    } finally {
      setApprovingReturn(null);
    }
  };


  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      const res = await api.get('/orders/seller-orders');
      setSellerOrders(res.data);
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleItemStatusUpdate = async (orderId, productId, newStatus) => {
    setUpdatingOrder(`${orderId}:${productId}`);
    try {
      await api.patch(`/orders/${orderId}/items/${productId}/status`, { status: newStatus });
      const res = await api.get('/orders/seller-orders');
      setSellerOrders(res.data);
    } catch (err) {
      console.error('Failed to update item status:', err);
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

        <div className="flex flex-wrap border-b border-[#2A2A2A] mb-8 gap-y-1">
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
            onClick={() => setActiveTab('delivery-issues')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'delivery-issues'
                ? 'text-[#E85D26]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Delivery issues
            {deliveryIssues.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                {deliveryIssues.length}
              </span>
            )}
            {activeTab === 'delivery-issues' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'returns'
                ? 'text-[#E85D26]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Returns
            {sellerReturns.filter(r => r.status === 'Pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                {sellerReturns.filter(r => r.status === 'Pending').length}
              </span>
            )}
            {activeTab === 'returns' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'sales'
                ? 'text-[#E85D26]'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            My Sales
            {activeTab === 'sales' && (
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


        {activeTab === 'sales' && (
          <div className="space-y-6 pt-4">
            <h2 className="text-2xl font-bold text-white mb-4">Sales Analytics</h2>
            {loadingSellerStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] animate-pulse">
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/2 mb-3" />
                    <div className="h-8 bg-[#1A1A1A] rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : sellerStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-8">
                <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A]">
                  <p className="text-sm text-gray-400 mb-1">Products Sold</p>
                  <p className="text-3xl font-bold text-white">{sellerStats.total_products_sold}</p>
                </div>
                <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A]">
                  <p className="text-sm text-gray-400 mb-1">Total Sales</p>
                  <p className="text-3xl font-bold text-[#E85D26]">৳{parseFloat(sellerStats.total_revenue || 0).toFixed(2)}</p>
                </div>
                <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A]">
                  <p className="text-sm text-gray-400 mb-1">Return Rate</p>
                  <p className="text-3xl font-bold text-red-400">{sellerStats.return_percentage}%</p>
                </div>
                <div className="bg-[#111111] p-6 rounded-xl border border-[#2A2A2A]">
                  <p className="text-sm text-gray-400 mb-1">Successful Delivery</p>
                  <p className="text-3xl font-bold text-green-400">{sellerStats.successful_delivery_percentage}%</p>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] text-center">No data available</div>
            )}

            {/* Product Contribution to Sales */}
            <div className="mt-8 pt-8 border-t border-[#2A2A2A]">
              <h3 className="text-2xl font-bold text-white mb-4">Product <span className="text-[#E85D26]">Contribution</span></h3>
              {myProducts.length === 0 ? (
                <div className="text-gray-500 bg-[#111111] p-6 rounded-xl border border-[#2A2A2A] text-center">
                  No products to analyze
                </div>
              ) : (
                <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#2A2A2A] bg-[#0A0A0A]/50">
                          <th className="py-4 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Product</th>
                          <th className="py-4 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold text-right">Sold</th>
                          <th className="py-4 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold text-right">Revenue</th>
                          <th className="py-4 px-4 text-xs text-gray-500 uppercase tracking-wider font-semibold text-right">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const totalRevenue = parseFloat(sellerStats?.total_revenue || 0);
                          const productsSorted = [...myProducts]
                            .map(p => ({
                              ...p,
                              estimatedRevenue: (p.order_count || 0) * parseFloat(p.unit_price || 0)
                            }))
                            .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
                            .filter(p => p.order_count > 0);

                          return productsSorted.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-6 px-4 text-center text-gray-500">No sales data yet</td>
                            </tr>
                          ) : (
                            productsSorted.map((product, idx) => {
                              const revenue = product.estimatedRevenue;
                              const percentage = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0';
                              return (
                                <tr key={product.product_id} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A]/30 transition-colors">
                                  <td className="py-4 px-4">
                                    <div>
                                      <p className="text-white font-medium text-sm">{product.name}</p>
                                      <p className="text-xs text-gray-500 mt-1">ID: {product.product_id?.slice(0, 8)}...</p>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <span className="text-white font-medium">{product.order_count || 0}</span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <span className="text-[#F59E0B] font-semibold">৳{revenue.toFixed(2)}</span>
                                  </td>
                                  <td className="py-4 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-[#E85D26] to-[#F59E0B] rounded-full" 
                                          style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-white font-medium text-sm w-12 text-right">{percentage}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
              <>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-6">
                <p className="text-sm text-gray-500">
                  Showing <span className="text-gray-300 font-medium">{filteredMyProducts.length}</span> of{' '}
                  <span className="text-gray-300 font-medium">{myProducts.length}</span> products
                </p>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={productStockFilter}
                    onChange={(e) => setProductStockFilter(e.target.value)}
                    className="px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                  >
                    <option value="all">All stock</option>
                    <option value="in_stock">In stock</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                  <select
                    value={productSort}
                    onChange={(e) => setProductSort(e.target.value)}
                    className="px-3 py-2 text-sm bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                  >
                    <option value="newest">Newest</option>
                    <option value="popular">Most popular</option>
                    <option value="rating">Highest rated</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                  </select>
                </div>
              </div>

              {filteredMyProducts.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <p className="text-gray-400 mb-2">No products match these filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setProductStockFilter('all');
                      setProductSort('newest');
                    }}
                    className="text-sm text-[#E85D26] hover:text-[#D14F1E] font-medium"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyProducts.map((product) => (
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

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#E85D26]/10 text-[#E85D26]">
                        {product.category_name}
                      </span>
                      {Number(product.discount_percent) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                          {Number(product.discount_percent).toFixed(0)}% off
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div>
                        {Number(product.discount_percent) > 0 && product.original_price != null && (
                          <p className="text-sm text-gray-500 line-through">
                            ৳{parseFloat(product.original_price).toFixed(2)}
                          </p>
                        )}
                        <p className="text-[#F59E0B] font-bold text-lg">
                          ৳{parseFloat(product.unit_price).toFixed(2)}
                          {Number(product.discount_percent) > 0 && (
                            <span className="text-xs font-semibold text-green-400 ml-2">
                              {Number(product.discount_percent).toFixed(0)}% off
                            </span>
                          )}
                        </p>
                      </div>
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
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <button type="button" onClick={(e) => { e.preventDefault(); openOfferModal(product); }} className="text-amber-400 hover:text-amber-300 font-medium transition-colors">Offers</button>
                        <button onClick={(e) => { e.preventDefault(); openEditModal(product); }} className="text-[#E85D26] hover:text-[#D14F1E] font-medium transition-colors">Edit</button>
                        <span>
                          {product.adding_date
                            ? new Date(product.adding_date).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
              </>
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
            ) : (
              <div className="space-y-4">
                {sellerOrders.length === 0 ? (
                  <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                    <span className="text-6xl block mb-4">📦</span>
                    <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
                    <p className="text-gray-400">
                      When customers order your products, they will appear here.
                    </p>
                  </div>
                ) : (
                sellerOrders.map((order) => {
                  const statusColors = {
                    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                    Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    Shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    Delivered: 'bg-green-500/10 text-green-400 border-green-500/30',
                    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
                  };
                  const statusClass = statusColors[order.order_status] || statusColors.Pending;
                  const isTargetOrder = orderParam && orderParam === order.order_id;

                  return (
                    <div
                      key={order.order_id}
                      className={`bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 hover:border-[#E85D26]/30 transition-all ${isTargetOrder ? 'ring-2 ring-[#E85D26]/40' : ''}`}
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
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColors[item.item_status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                {item.item_status || 'Pending'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <select
                                value={item.item_status || 'Pending'}
                                onChange={(e) => handleItemStatusUpdate(order.order_id, item.product_id, e.target.value)}
                                disabled={updatingOrder === `${order.order_id}:${item.product_id}`}
                                className="px-3 py-1.5 text-xs bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E85D26] disabled:opacity-50"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              <span className="text-sm text-[#F59E0B] font-medium">
                                ৳{parseFloat(item.net_price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#1A1A1A] flex justify-end">
                        <p className="text-lg font-bold text-white">
                          Total: <span className="text-[#F59E0B]">৳{parseFloat(order.total_amount).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'delivery-issues' && (
          <>
            {loadingDeliveryIssues ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                    <div className="h-5 bg-[#1A1A1A] rounded w-1/3 mb-3" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : deliveryIssues.length === 0 ? (
              <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <span className="text-6xl block mb-4">✓</span>
                <h2 className="text-2xl font-bold text-white mb-2">No delivery issues</h2>
                <p className="text-gray-400">
                  When a customer reports a problem during delivery confirmation, it will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Delivery <span className="text-red-400">Issues</span>
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Customer feedback when they confirm an item was not received properly.
                </p>
                <div className="space-y-3">
                  {deliveryIssues.map((iss) => (
                    <div key={iss.issue_id} className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm text-white font-medium">
                          {iss.product_name}{' '}
                          <span className="text-gray-500 text-xs">
                            • Order #{iss.order_id?.slice(0, 8)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {iss.created_at ? new Date(iss.created_at).toLocaleString() : ''}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Customer: <span className="text-gray-300">{iss.customer_name}</span>
                      </p>
                      {iss.feedback && (
                        <p className="text-sm text-red-300 mt-2">{iss.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'returns' && (
          <>
            {loadingReturns ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                    <div className="h-5 bg-[#1A1A1A] rounded w-1/3 mb-3" />
                    <div className="h-4 bg-[#1A1A1A] rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : sellerReturns.length === 0 ? (
              <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <span className="text-6xl block mb-4">✅</span>
                <h2 className="text-2xl font-bold text-white mb-2">No return requests</h2>
                <p className="text-gray-400">When customers request returns on your products, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerReturns.map((ret) => {
                  const statusColors = {
                    Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                    Approved: 'bg-green-500/10 text-green-400 border-green-500/30',
                    Rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
                  };
                  const statusClass = statusColors[ret.status] || statusColors.Pending;

                  return (
                    <div key={ret.return_id} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 hover:border-[#E85D26]/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Return #{ret.return_id.slice(0, 8)}...</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {new Date(ret.return_date).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusClass}`}>
                            {ret.status}
                          </span>
                          {ret.status === 'Pending' && (
                            <button
                              onClick={() => handleApproveReturn(ret.return_id)}
                              disabled={approvingReturn === ret.return_id}
                              className="px-4 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {approvingReturn === ret.return_id ? 'Approving...' : 'Approve Return'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <span className="text-gray-400">Customer:</span>
                        <span className="text-white font-medium">{ret.customer_name}</span>
                        <span className="ml-3 text-gray-500">• Order #{ret.order_id.slice(0, 8)}...</span>
                      </div>

                      <div className="bg-[#0A0A0A] rounded-lg p-4 mb-3">
                        <p className="text-sm text-gray-400 mb-1">Reason</p>
                        <p className="text-white text-sm">{ret.reason}</p>
                      </div>

                      {Array.isArray(ret.image_urls) && ret.image_urls.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-400 mb-2">Customer photos</p>
                          <div className="flex flex-wrap gap-2">
                            {ret.image_urls.map((url, i) => (
                              <a
                                key={`${ret.return_id}-${i}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-20 h-20 rounded-lg border border-[#2A2A2A] overflow-hidden bg-[#0A0A0A] shrink-0"
                              >
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <p className="text-sm font-medium text-[#F59E0B]">
                          Refund: ৳{parseFloat(ret.refund_amount).toFixed(2)}
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
                    Unit Price (৳) <span className="text-red-400">*</span>
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

        {offerModalProduct && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !offerSubmitting && closeOfferModal()}>
            <div
              className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  Offers — <span className="text-amber-400">{offerModalProduct.name}</span>
                </h3>
                <button type="button" onClick={closeOfferModal} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Set a time-limited discount (%) on this product. Shoppers see the reduced price while the offer is active.
              </p>

              {offerError && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">{offerError}</div>
              )}

              <form onSubmit={handleCreateOffer} className="space-y-3 mb-6 pb-6 border-b border-[#2A2A2A]">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs text-gray-400 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      required
                      value={offerForm.offerPercent}
                      onChange={(e) => setOfferForm((prev) => ({ ...prev, offerPercent: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start</label>
                      <input
                        type="datetime-local"
                        required
                        value={offerForm.startDate}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">End</label>
                      <input
                        type="datetime-local"
                        required
                        value={offerForm.expiryDate}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="w-full py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {offerSubmitting ? 'Saving...' : 'Add offer'}
                </button>
              </form>

              <h4 className="text-sm font-semibold text-gray-300 mb-2">Existing offers</h4>
              {offerLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : productOffers.length === 0 ? (
                <p className="text-sm text-gray-500">No offers yet.</p>
              ) : (
                <ul className="space-y-2">
                  {productOffers.map((o) => (
                    <li
                      key={o.offer_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-[#0A0A0A] rounded-lg border border-[#1A1A1A]"
                    >
                      <div>
                        <p className="text-sm text-white">
                          <span className="text-amber-400 font-semibold">{Number(o.offer_percent).toFixed(1)}%</span>
                          <span className={` ml-2 text-[10px] px-2 py-0.5 rounded-full ${o.is_active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                            {o.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {o.start_date ? new Date(o.start_date).toLocaleString() : ''} — {o.expiry_date ? new Date(o.expiry_date).toLocaleString() : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteOffer(o.offer_id)}
                        className="text-xs text-red-400 hover:text-red-300 shrink-0"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editModalProduct && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeEditModal}>
            <div
              className="bg-[#111111] border border-[#2A2A2A] rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">
                  Edit Product
                </h3>
                <button onClick={closeEditModal} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editFormError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                  {editFormError}
                </div>
              )}

              {editFormSuccess && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm">
                  {editFormSuccess}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Product Name *</label>
                  <input 
                    type="text" required value={editForm.name} 
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Unit Price ($) *</label>
                    <input 
                      type="number" step="0.01" min="0" required value={editForm.unitPrice} 
                      onChange={e => setEditForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Stock Quantity *</label>
                    <input 
                      type="number" min="0" required value={editForm.stockQuantity} 
                      onChange={e => setEditForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Category *</label>
                    <select 
                      required value={editForm.categoryId} 
                      onChange={e => setEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Condition *</label>
                    <select 
                      required value={editForm.conditionState} 
                      onChange={e => setEditForm(prev => ({ ...prev, conditionState: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white"
                    >
                      <option value="New">New</option>
                      <option value="Used - Like New">Used - Like New</option>
                      <option value="Used - Good">Used - Good</option>
                      <option value="Used - Fair">Used - Fair</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                  <textarea 
                    rows="3" value={editForm.description} 
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white" 
                  ></textarea>
                </div>

                <button 
                  type="submit" disabled={editSubmitting}
                  className="w-full py-3 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E]"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
