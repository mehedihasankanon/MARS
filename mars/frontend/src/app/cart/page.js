'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CartPage() {

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cart, setCart] = useState(null);          
  const [cartItems, setCartItems] = useState([]);  
  const [loading, setLoading] = useState(true);    
  const [updating, setUpdating] = useState(null);  
  const [error, setError] = useState('');           

  useEffect(() => {
    if (authLoading) return; 

    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchCart();
  }, [user, authLoading]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      const cartData = res.data;
      setCart(cartData);

      if (cartData.items && cartData.items.length > 0) {

        const enrichedItems = await Promise.all(
          cartData.items.map(async (item) => {
            try {
              const productRes = await api.get(`/products/${item.product_id}`);
              return {
                ...item,
                product: productRes.data, 
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

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return; 

    setUpdating(productId);
    try {
      await api.put(`/cart/items/${productId}`, { quantity: newQuantity });
      await fetchCart(); 
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setUpdating(itemId);
    try {
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart(); 
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdating(null);
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.net_price || 0);
  }, 0);

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-white mb-2">
          Shopping <span className="text-[#E85D26]">Cart</span>
        </h1>
        <p className="text-gray-400 mb-8">
          {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
        </p>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-6xl block mb-4"></span>
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

          <div className="grid lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (

                <div
                  key={item.product_id}
                  className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >

                  <div className="w-20 h-20 bg-[#1A1A1A] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product?.images && item.product.images.length > 0 && item.product.images[0]?.image_url ? (
                      <img
                        src={item.product.images[0].image_url}
                        alt={item.product?.name || 'Product image'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl opacity-30">📦</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-white font-medium hover:text-[#E85D26] transition-colors truncate block"
                    >
                      {item.product?.name || 'Product'}
                    </Link>
                    <div className="mt-1">
                      {Number(item.product?.discount_percent) > 0 &&
                        item.product?.original_price != null && (
                          <span className="text-sm text-gray-500 line-through mr-2">
                            ৳{parseFloat(item.product.original_price).toFixed(2)}
                          </span>
                        )}
                      <span className="text-[#E85D26] font-semibold">
                        ৳{parseFloat(item.product?.unit_price || 0).toFixed(2)} each
                        {Number(item.product?.discount_percent) > 0 && (
                          <span className="text-green-400 text-xs font-medium ml-2">
                            ({Number(item.product.discount_percent).toFixed(0)}% off)
                          </span>
                        )}
                      </span>
                    </div>
                    {item.product?.stock_quantity != null && (
                      <p className="text-xs mt-1 text-gray-500">
                        {item.product.stock_quantity - item.quantity > 0
                          ? <span className="text-green-400">You can add {item.product.stock_quantity - item.quantity} more</span>
                          : <span className="text-amber-400">Max quantity reached</span>}
                      </p>
                    )}
                  </div>

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
                      disabled={updating === item.product_id || item.quantity >= (item.product?.stock_quantity || Infinity)}
                      className="px-3 py-2 text-gray-400 hover:text-white hover:bg-[#1A1A1A] transition-colors disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right flex sm:flex-col items-center sm:items-end gap-3">
                    <span className="text-white font-semibold">
                      ৳{parseFloat(item.net_price || 0).toFixed(2)}
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

            <div className="lg:col-span-1">
              <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>

                <div className="flex justify-between text-gray-400 mb-2">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="text-white">৳{cartTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-gray-400 mb-4">
                  <span>Shipping</span>
                  <span className="text-gray-500 text-sm">Calculated at checkout</span>
                </div>

                <div className="border-t border-[#2A2A2A] pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-[#E85D26] font-bold text-lg">৳{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full py-3 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] transition-colors text-center shadow-lg shadow-[#E85D26]/20"
                >
                  Proceed to Checkout
                </Link>

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
