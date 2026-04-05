"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ProductsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [wishlistCache, setWishlistCache] = useState(new Set());

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(
    searchParams.get("seller") || "",
  );
  const [selectedSellerName, setSelectedSellerName] = useState(
    searchParams.get("sellerName") || "",
  );
  const [sortBy, setSortBy] = useState("newest");
  const [stockFilter, setStockFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedSeller(searchParams.get("seller") || "");
    setSelectedSellerName(searchParams.get("sellerName") || "");
  }, [searchParams]);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => {
        setCategories(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      api
        .get("/wishlist")
        .then((res) => {
          const ids = res.data.map((item) => item.product_id);
          setWishlistCache(new Set(ids));
        })
        .catch(() => {});
    } else {
      setWishlistCache(new Set());
    }
  }, [user]);

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to manage your wishlist");
      return;
    }

    const product = products.find((p) => p.product_id === productId);
    if (product && product.seller_name === user.username) {
      alert("You cannot wishlist your own product.");
      return;
    }

    try {
      if (wishlistCache.has(productId)) {
        await api.delete(`/wishlist/items/${productId}`);
        setWishlistCache((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.post(`/wishlist/items/${productId}`);
        setWishlistCache((prev) => new Set(prev).add(productId));
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update wishlist",
      );
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (sortBy) params.append("sort", sortBy);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedSeller) params.append("seller", selectedSeller);

      const res = await api.get(`/products?${params.toString()}`);
      let filteredProducts = res.data;

      // Apply stock filter
      if (stockFilter === "in_stock") {
        filteredProducts = filteredProducts.filter((p) => p.stock_quantity > 0);
      } else if (stockFilter === "out_of_stock") {
        filteredProducts = filteredProducts.filter((p) => p.stock_quantity === 0 || p.stock_quantity <= 0);
      }

      // Sort to show in-stock items first (always, regardless of other sorting)
      filteredProducts.sort((a, b) => {
        const aInStock = a.stock_quantity > 0 ? 1 : 0;
        const bInStock = b.stock_quantity > 0 ? 1 : 0;
        return bInStock - aInStock;
      });

      setProducts(filteredProducts);
      if (selectedSeller) {
        const sellerNameFromResults = res.data?.[0]?.seller_name;
        if (sellerNameFromResults) {
          setSelectedSellerName(sellerNameFromResults);
        }
      } else {
        setSelectedSellerName("");
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchQuery, selectedSeller, stockFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Products</h1>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse"
              >
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
            {products.length} product{products.length !== 1 ? "s" : ""}{" "}
            available
          </p>
          {selectedSeller && (
            <p className="text-sm text-[#E85D26] mt-1">
              Showing all listed products from{" "}
              {selectedSellerName || "this seller"}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
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
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors cursor-pointer"
          >
            <option value="all">All Items</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-[#E85D26] transition-colors cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popularity">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="offers">Offers</option>
          </select>
        </div>

        {products.length === 0 && !loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">No products found</p>
            <p className="text-gray-600 text-sm">
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.product_id}
                href={`/products/${product.product_id}`}
                className="group bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#E85D26]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#E85D26]/5 relative"
              >
                <div className="w-full h-48 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] flex items-center justify-center overflow-hidden relative">
                  <button
                    onClick={(e) => handleToggleWishlist(e, product.product_id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10"
                    title={
                      wishlistCache.has(product.product_id)
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                    }
                  >
                    <svg
                      className={`w-5 h-5 transition-colors ${wishlistCache.has(product.product_id) ? "text-red-500 fill-red-500" : "text-gray-300 fill-transparent hover:text-white"}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={
                        wishlistCache.has(product.product_id) ? "0" : "2"
                      }
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  {product.images &&
                  product.images.length > 0 &&
                  product.images[0].image_url ? (
                    <img
                      src={product.images[0].image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl opacity-30">📦</span>
                  )}
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

                  <div className="flex items-center justify-between mt-auto gap-2 flex-wrap">
                    <div className="flex flex-col items-start">
                      {Number(product.discount_percent) > 0 && product.original_price != null && (
                        <span className="text-sm text-gray-500 line-through">
                          ৳{parseFloat(product.original_price).toFixed(2)}
                        </span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-[#E85D26]">
                          ৳{parseFloat(product.unit_price).toFixed(2)}
                        </span>
                        {Number(product.discount_percent) > 0 && (
                          <span className="text-xs font-semibold text-green-400">
                            {Number(product.discount_percent).toFixed(0)}% off
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        product.stock_quantity > 0
                          ? "text-green-400 bg-green-400/10"
                          : "text-red-400 bg-red-400/10"
                      }`}
                    >
                      {product.stock_quantity > 0
                        ? `${product.stock_quantity} in stock`
                        : "Out of stock"}
                    </span>
                  </div>

                  <p className="text-gray-600 text-xs mt-3">
                    Sold by{" "}
                    <span className="text-gray-400">{product.seller_name}</span>
                    {product.seller_rating > 0 && (
                      <span className="ml-2 text-yellow-400">
                        ★ {parseFloat(product.seller_rating).toFixed(1)}
                      </span>
                    )}
                  </p>

                  {parseFloat(product.avg_rating) > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= Math.round(parseFloat(product.avg_rating)) ? "text-yellow-400" : "text-gray-600"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({product.review_count})
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
