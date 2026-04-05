'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await api.get('/wishlist');
        setWishlist(res.data);
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
        setError('Failed to load your wishlist.');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user, authLoading, router]);

  const handleRemove = async (e, productId) => {
    e.preventDefault();
    try {
      await api.delete(`/wishlist/items/${productId}`);
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Failed to remove item from wishlist.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">My Wishlist</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            My <span className="text-[#E85D26]">Wishlist</span>
          </h1>
          <p className="text-gray-400">
            {wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {wishlist.length === 0 && !error ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-6xl block mb-4">❤️</span>
            <h2 className="text-2xl font-bold text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-6">Explore products and save them for later.</p>
            <Link
              href="/products"
              className="px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map(product => (
              <Link
                key={product.product_id}
                href={`/products/${product.product_id}`}
                className="group bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#E85D26]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#E85D26]/5 relative flex flex-col"
              >
                <div className="w-full h-48 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center overflow-hidden relative">
                  <button
                    onClick={(e) => handleRemove(e, product.product_id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
                    title="Remove from wishlist"
                  >
                    <svg className="w-5 h-5 text-red-500 fill-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  {product.images && product.images.length > 0 && product.images[0]?.image_url ? (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl opacity-30">📦</span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
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
                      ৳{parseFloat(product.unit_price).toFixed(2)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.stock_quantity > 0
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-red-400 bg-red-400/10'
                    }`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
