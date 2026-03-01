'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProductDetailPage() {

  const params = useParams();         
  const router = useRouter();         
  const { user } = useAuth();         

  const [product, setProduct] = useState(null);       
  const [quantity, setQuantity] = useState(1);         
  const [loading, setLoading] = useState(true);        
  const [addingToCart, setAddingToCart] = useState(false); 
  const [cartMessage, setCartMessage] = useState({ type: '', text: '' }); 

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

  const handleAddToCart = async () => {

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

  const inStock = product.stock_quantity > 0;
  const formattedPrice = parseFloat(product.unit_price).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/products" className="hover:text-[#E85D26] transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-300 truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">

          <div className="w-full h-80 md:h-96 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-center">
            <span className="text-8xl opacity-20"></span>
          </div>

          <div className="flex flex-col">

            <span className="inline-block w-fit px-3 py-1 text-xs font-medium text-[#E85D26] bg-[#E85D26]/10 rounded-full mb-3">
              {product.category_name}
            </span>

            <h1 className="text-3xl font-bold text-white mb-2">
              {product.name}
            </h1>

            <p className="text-gray-500 text-sm mb-4">
              Sold by <span className="text-gray-300">{product.seller_name}</span>
            </p>

            <p className="text-4xl font-bold text-[#E85D26] mb-6">
              ${formattedPrice}
            </p>

            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
                <p className="text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">

              {product.condition_state && (
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Condition</p>
                  <p className="text-sm text-white font-medium">{product.condition_state}</p>
                </div>
              )}

              <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Availability</p>
                <p className={`text-sm font-medium ${inStock ? 'text-green-400' : 'text-red-400'}`}>
                  {inStock ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </p>
              </div>
            </div>

            {inStock && (
              <div className="flex items-center gap-4 mb-4">

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

                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 py-3 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#E85D26]/20"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            )}

            {!inStock && (
              <div className="py-3 px-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm text-center">
                This product is currently out of stock.
              </div>
            )}

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
