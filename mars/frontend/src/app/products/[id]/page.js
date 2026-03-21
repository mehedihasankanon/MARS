"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState({ type: "", text: "" });
  const [selectedImage, setSelectedImage] = useState(0);
  const autoSlideRef = useRef(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistToggling, setWishlistToggling] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: "", text: "" });

  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState({});
  const [answeringId, setAnsweringId] = useState(null);

  const [activeTab, setActiveTab] = useState("reviews");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${params.id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  useEffect(() => {
    if (!params.id) return;
    api
      .get(`/reviews/${params.id}`)
      .then((res) => setReviews(res.data))
      .catch(() => {});
    api
      .get(`/questions/${params.id}`)
      .then((res) => setQuestions(res.data))
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (user && params.id) {
      api
        .get("/wishlist")
        .then((res) => {
          const ids = res.data.map((item) => item.product_id);
          setIsWishlisted(ids.includes(params.id));
        })
        .catch(() => {});
    }
  }, [user, params.id]);

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    const isOwnProduct = user && product?.seller_name === user.username;
    if (isOwnProduct) return;

    setWishlistToggling(true);
    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/items/${params.id}`);
        setIsWishlisted(false);
      } else {
        await api.post(`/wishlist/items/${params.id}`);
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update wishlist",
      );
    } finally {
      setWishlistToggling(false);
    }
  };

  const imageCount = product?.images?.length || 0;

  const goToSlide = useCallback((index) => {
    setSelectedImage(index);
  }, []);

  const nextSlide = useCallback(() => {
    setSelectedImage((prev) => (prev + 1) % imageCount);
  }, [imageCount]);

  const prevSlide = useCallback(() => {
    setSelectedImage((prev) => (prev - 1 + imageCount) % imageCount);
  }, [imageCount]);

  useEffect(() => {
    if (imageCount <= 1) return;
    autoSlideRef.current = setInterval(nextSlide, 4000);
    return () => clearInterval(autoSlideRef.current);
  }, [imageCount, nextSlide]);

  const pauseAutoSlide = () => clearInterval(autoSlideRef.current);
  const resumeAutoSlide = () => {
    if (imageCount <= 1) return;
    clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(nextSlide, 4000);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return router.push("/auth/login");
    setReviewSubmitting(true);
    setReviewMessage({ type: "", text: "" });
    try {
      await api.post(`/reviews/${params.id}`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setReviewMessage({ type: "success", text: "Review submitted!" });
      setReviewForm({ rating: 5, comment: "" });
      const [revRes, prodRes] = await Promise.all([
        api.get(`/reviews/${params.id}`),
        api.get(`/products/${params.id}`),
      ]);
      setReviews(revRes.data);
      setProduct(prodRes.data);
    } catch (err) {
      setReviewMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to submit review",
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await api.delete(`/reviews/${params.id}/${reviewId}`);
      const [revRes, prodRes] = await Promise.all([
        api.get(`/reviews/${params.id}`),
        api.get(`/products/${params.id}`),
      ]);
      setReviews(revRes.data);
      setProduct(prodRes.data);
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!user) return router.push("/auth/login");
    if (!questionText.trim()) return;
    setQuestionSubmitting(true);
    try {
      await api.post(`/questions/${params.id}`, {
        questionText: questionText.trim(),
      });
      setQuestionText("");
      const res = await api.get(`/questions/${params.id}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to submit question:", err);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    const text = answerText[questionId];
    if (!text || !text.trim()) return;
    setAnsweringId(questionId);
    try {
      await api.put(`/questions/${params.id}/${questionId}/answer`, {
        answerText: text.trim(),
      });
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
      const res = await api.get(`/questions/${params.id}`);
      setQuestions(res.data);
    } catch (err) {
      console.error("Failed to answer question:", err);
    } finally {
      setAnsweringId(null);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setAddingToCart(true);
    setCartMessage({ type: "", text: "" });

    try {
      await api.post("/cart/items", {
        product_id: product.product_id,
        quantity: quantity,
      });
      setCartMessage({
        type: "success",
        text: `Added ${quantity} item${quantity > 1 ? "s" : ""} to your cart!`,
      });
    } catch (err) {
      setCartMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to add to cart. Make sure you are logged in as a customer.",
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
          <h2 className="text-2xl font-bold text-white mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            This product may have been removed or doesn&apos;t exist.
          </p>
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
  const isOwnProduct = user && product.seller_name === user.username;

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link
            href="/products"
            className="hover:text-[#E85D26] transition-colors"
          >
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-300 truncate">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <div
              className="relative w-full h-80 md:h-96 bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden group"
              onMouseEnter={pauseAutoSlide}
              onMouseLeave={resumeAutoSlide}
            >
              {product.images && product.images.length > 0 ? (
                <>
                  <div
                    className="flex h-full transition-transform duration-500 ease-in-out"
                    style={{
                      transform: `translateX(-${selectedImage * 100}%)`,
                    }}
                  >
                    {product.images.map((img, idx) => (
                      <div
                        key={img.image_id}
                        className="w-full h-full flex-shrink-0 flex items-center justify-center"
                      >
                        <img
                          src={img.image_url}
                          alt={`${product.name} - ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>

                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>

                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => goToSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              selectedImage === idx
                                ? "bg-[#E85D26] w-4"
                                : "bg-white/40 hover:bg-white/60"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl opacity-20">📦</span>
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={img.image_id}
                    onClick={() => goToSlide(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                      selectedImage === idx
                        ? "border-[#E85D26]"
                        : "border-[#2A2A2A] hover:border-gray-500"
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="inline-block w-fit px-3 py-1 text-xs font-medium text-[#E85D26] bg-[#E85D26]/10 rounded-full mb-3">
              {product.category_name}
            </span>

            <h1 className="text-3xl font-bold text-white mb-2">
              {product.name}
            </h1>

            <p className="text-gray-500 text-sm mb-2 underline">
              Sold by{" "}
              <Link
                href={`/products?seller=${product.seller_id}&sellerName=${encodeURIComponent(product.seller_name)}`}
                className="text-gray-300 hover:text-[#E85D26] underline underline-offset-2 transition-colors"
              >
                {product.seller_name}
              </Link>
              {product.seller_rating > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-yellow-400 text-xs font-medium bg-yellow-400/10 px-2 py-0.5 rounded-full">
                  ★ {parseFloat(product.seller_rating).toFixed(1)} seller rating
                </span>
              )}
            </p>

            {parseFloat(product.avg_rating) > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(parseFloat(product.avg_rating)) ? "text-yellow-400" : "text-gray-600"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-400">
                  {parseFloat(product.avg_rating).toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({product.review_count} review
                  {product.review_count !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            <p className="text-4xl font-bold text-[#E85D26] mb-6">
              ${formattedPrice}
            </p>

            {product.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Description
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              {product.condition_state && (
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Condition</p>
                  <p className="text-sm text-white font-medium">
                    {product.condition_state}
                  </p>
                </div>
              )}

              <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Availability</p>
                <p
                  className={`text-sm font-medium ${inStock ? "text-green-400" : "text-red-400"}`}
                >
                  {inStock
                    ? `${product.stock_quantity} in stock`
                    : "Out of stock"}
                </p>
              </div>
            </div>

            {inStock && !isOwnProduct && (
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
                    onClick={() =>
                      setQuantity(
                        Math.min(product.stock_quantity, quantity + 1),
                      )
                    }
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
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistToggling}
                  className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center disabled:opacity-50 ${isWishlisted ? "border-[#E85D26] bg-[#E85D26]/10 text-[#E85D26]" : "border-[#2A2A2A] bg-[#111111] text-gray-400 hover:border-gray-500 hover:text-white"}`}
                  title={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  <svg
                    className={`w-6 h-6 ${isWishlisted ? "fill-current" : "fill-transparent"}`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={isWishlisted ? "0" : "2"}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            )}

            {inStock && isOwnProduct && (
              <div className="py-3 px-4 bg-amber-900/20 border border-amber-800 rounded-lg text-amber-400 text-sm text-center mb-4">
                This is your own product — you cannot add it to your cart.
              </div>
            )}

            {!inStock && (
              <div className="py-3 px-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm text-center">
                This product is currently out of stock.
              </div>
            )}

            {cartMessage.text && (
              <div
                className={`mt-3 px-4 py-3 rounded-lg text-sm ${
                  cartMessage.type === "success"
                    ? "bg-green-900/20 border border-green-800 text-green-400"
                    : "bg-red-900/20 border border-red-800 text-red-400"
                }`}
              >
                {cartMessage.text}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-[#2A2A2A] pt-8">
          <div className="flex border-b border-[#2A2A2A] mb-6">
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "reviews"
                  ? "text-[#E85D26]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Reviews ({reviews.length})
              {activeTab === "reviews" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("qa")}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "qa"
                  ? "text-[#E85D26]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Questions & Answers ({questions.length})
              {activeTab === "qa" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E85D26]" />
              )}
            </button>
          </div>

          {activeTab === "reviews" && (
            <div>
              {user && !isOwnProduct && (
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Write a Review
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setReviewForm((f) => ({ ...f, rating: star }))
                            }
                            className="focus:outline-none"
                          >
                            <svg
                              className={`w-7 h-7 transition-colors ${star <= reviewForm.rating ? "text-yellow-400" : "text-gray-600 hover:text-gray-400"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((f) => ({
                            ...f,
                            comment: e.target.value,
                          }))
                        }
                        placeholder="Share your experience with this product..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="px-6 py-2.5 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {reviewSubmitting ? "Submitting..." : "Submit Review"}
                      </button>
                      {reviewMessage.text && (
                        <span
                          className={`text-sm ${reviewMessage.type === "success" ? "text-green-400" : "text-red-400"}`}
                        >
                          {reviewMessage.text}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No reviews yet. Be the first to review this product!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.review_id}
                      className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {review.profile_picture ? (
                            <img
                              src={review.profile_picture}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E85D26] to-[#F59E0B] flex items-center justify-center text-white text-xs font-bold">
                              {review.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">
                              {review.username}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(
                                review.review_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= review.rating ? "text-yellow-400" : "text-gray-600"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {user &&
                            (user.username === review.username ||
                              user.role === "admin") && (
                              <button
                                onClick={() =>
                                  handleDeleteReview(review.review_id)
                                }
                                className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                                title="Delete review"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-300 text-sm mt-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "qa" && (
            <div>
              {user && !isOwnProduct && (
                <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Ask a Question
                  </h3>
                  <form onSubmit={handleSubmitQuestion} className="flex gap-3">
                    <input
                      type="text"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="What would you like to know about this product?"
                      className="flex-1 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                    />
                    <button
                      type="submit"
                      disabled={questionSubmitting || !questionText.trim()}
                      className="px-6 py-3 bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      {questionSubmitting ? "Posting..." : "Ask"}
                    </button>
                  </form>
                </div>
              )}

              {questions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.question_id}
                      className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-[#E85D26] font-bold text-sm mt-0.5">
                          Q:
                        </span>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {q.question_text}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Asked by{" "}
                            <span className="text-gray-400">
                              {q.customer_username}
                            </span>
                            {" · "}
                            {new Date(q.question_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {q.answer_text ? (
                        <div className="flex items-start gap-3 mt-3 pl-6 border-l-2 border-[#E85D26]/30">
                          <span className="text-green-400 font-bold text-sm mt-0.5">
                            A:
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-300 text-sm">
                              {q.answer_text}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              Answered by{" "}
                              <span className="text-gray-400">
                                {q.seller_username}
                              </span>
                              {" · "}
                              {new Date(q.answer_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ) : isOwnProduct ? (
                        <div className="mt-3 pl-6 flex gap-2">
                          <input
                            type="text"
                            value={answerText[q.question_id] || ""}
                            onChange={(e) =>
                              setAnswerText((prev) => ({
                                ...prev,
                                [q.question_id]: e.target.value,
                              }))
                            }
                            placeholder="Write your answer..."
                            className="flex-1 px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                          />
                          <button
                            onClick={() => handleSubmitAnswer(q.question_id)}
                            disabled={answeringId === q.question_id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                          >
                            {answeringId === q.question_id ? "..." : "Answer"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-600 text-xs mt-2 pl-6 italic">
                          Awaiting seller response...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
