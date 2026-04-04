'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [platformStats, setPlatformStats] = useState(null);
  const [topSellers, setTopSellers] = useState([]);
  const [bestProducts, setBestProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'admin') { router.replace('/'); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, sellersRes, productsRes, catRes] = await Promise.all([
          api.get('/analytics/platform'),
          api.get('/analytics/top-sellers'),
          api.get('/analytics/best-selling'),
          api.get('/analytics/categories'),
        ]);
        setPlatformStats(statsRes.data);
        setTopSellers(sellersRes.data);
        setBestProducts(productsRes.data);
        setCategoryStats(catRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E85D26] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            Platform <span className="text-[#E85D26]">Analytics</span>
          </h1>
          <p className="text-gray-400">Real-time insights across the MARS marketplace</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 animate-pulse">
                <div className="h-4 bg-[#1A1A1A] rounded w-1/2 mb-3" />
                <div className="h-8 bg-[#1A1A1A] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Platform Overview Cards */}
            {platformStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                {[
                  { label: 'Total Users', value: platformStats.total_users, icon: '👤' },
                  { label: 'Total Products', value: platformStats.total_products, icon: '📦' },
                  { label: 'Total Orders', value: platformStats.total_orders, icon: '🛒' },
                  { label: 'Revenue', value: `$${parseFloat(platformStats.total_revenue || 0).toLocaleString()}`, icon: '💰' },
                  { label: 'Avg Rating', value: platformStats.platform_avg_rating || 'N/A', icon: '⭐' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#E85D26]/30 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{stat.icon}</span>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Top Sellers */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-4">Top <span className="text-[#E85D26]">Sellers</span></h2>
              {topSellers.length === 0 ? (
                <p className="text-gray-500">No seller data yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topSellers.map((seller, i) => (
                    <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#E85D26]/30 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E85D26] to-[#F59E0B] flex items-center justify-center text-white font-bold text-lg">
                          {seller.seller_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{seller.seller_name}</p>
                          <p className="text-xs text-gray-500">{seller.total_products} products</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[#F59E0B] font-bold">${parseFloat(seller.total_revenue || 0).toFixed(0)}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                        <div>
                          <p className="text-white font-bold">{seller.total_orders}</p>
                          <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div>
                          <p className="text-white font-bold">{seller.avg_product_rating || 'N/A'}</p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Best Selling Products */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-4">Best <span className="text-[#E85D26]">Selling Products</span></h2>
              {bestProducts.length === 0 ? (
                <p className="text-gray-500">No sales data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#2A2A2A]">
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase">#</th>
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase">Product</th>
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase">Category</th>
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase">Seller</th>
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase text-right">Sold</th>
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase text-right">Revenue</th>
                        <th className="py-3 px-4 text-xs text-gray-500 uppercase text-right">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestProducts.map((p, i) => (
                        <tr key={p.product_id} className="border-b border-[#1A1A1A] hover:bg-[#111111] transition-colors">
                          <td className="py-3 px-4 text-gray-500 text-sm">{i + 1}</td>
                          <td className="py-3 px-4">
                            <Link href={`/products/${p.product_id}`} className="text-white hover:text-[#E85D26] transition-colors text-sm font-medium">
                              {p.product_name}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E85D26]/10 text-[#E85D26]">{p.category_name}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">{p.seller_name}</td>
                          <td className="py-3 px-4 text-sm text-white font-medium text-right">{p.total_sold}</td>
                          <td className="py-3 px-4 text-sm text-[#F59E0B] font-medium text-right">${parseFloat(p.total_revenue || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-white text-right">{p.avg_rating || 'N/A'} ⭐</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Category Analytics */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-white mb-4">Category <span className="text-[#E85D26]">Breakdown</span></h2>
              {categoryStats.length === 0 ? (
                <p className="text-gray-500">No category data yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryStats.map((cat) => (
                    <div key={cat.category_id} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 hover:border-[#E85D26]/30 transition-all">
                      <h3 className="text-white font-semibold mb-3">{cat.category_name}</h3>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <p className="text-gray-500">Products</p>
                          <p className="text-white font-medium">{cat.product_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Orders</p>
                          <p className="text-white font-medium">{cat.total_orders}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Revenue</p>
                          <p className="text-[#F59E0B] font-medium">${parseFloat(cat.total_revenue || 0).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Rating</p>
                          <p className="text-white font-medium">{cat.avg_rating || 'N/A'} ⭐</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
