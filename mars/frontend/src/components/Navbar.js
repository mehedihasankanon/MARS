"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const { user, logout, loading } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getNotificationMeta = (n) => {
    let type = n.notification_type;
  
    if (!type) {
      if (n.message?.startsWith("New order received")) {
        type = "order";
      } else if (n.message?.startsWith("A new question was asked")) {
        type = "question";
      } else if (n.message?.startsWith("A new review was posted")) {
        type = "review";
      } else {
        type = "general";
      }
    }
  
    let href = null;
  
    if (type === "order" && n.order_id) {
      href = `/dashboard?tab=orders&order=${n.order_id}`;
    } else if (type === "delivery_confirm" && n.order_id && n.product_id) {
      href = `/orders?order=${n.order_id}&product=${n.product_id}`;
    } else if (n.product_id) {
      href = `/products/${n.product_id}`;
    }
  
    let badge = "Notice";
  
    if (type === "order") badge = "Order";
    else if (type === "question") badge = "Question";
    else if (type === "review") badge = "Review";
    else if (type === "delivery_confirm") badge = "Delivery";
    else if (type === "seller_approved") badge = "Seller";
  
    return { type, href, badge };
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#1A1A1A] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/mars-logo.png"
                alt="MARS logo"
                width={40}
                height={45}
                className="rounded-lg"
              />
              <div>
                <span className="text-xl font-bold text-[#E85D26] group-hover:text-[#FF7A45] transition-colors">
                  MARS
                </span>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Marketplace & Retailing
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" label="Home" />
            <NavLink href="/products" label="Products" />
            {user && (
              <>
                <NavLink href="/cart" label="Cart" />
                <NavLink href="/orders" label="Orders" />
                <NavLink href="/wishlist" label="Wishlist" />
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {loading ? null : user ? (
              <>
                <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="p-2 text-gray-300 hover:text-[#E85D26] hover:scale-103 cursor-pointer relative"
                    >
                      🔔
                      {notifications.filter((n) => !n.is_read).length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0A0A0A]"></span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-[#111111] border border-[#2A2A2A] rounded-xl shadow-xl overflow-hidden z-50">
                        <div className="p-3 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
                          <h3 className="text-sm font-bold text-white">
                            Notifications
                          </h3>
                          {notifications.some((n) => !n.is_read) && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-xs text-[#E85D26] hover:text-[#D14F1E]"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">
                              No notifications
                            </div>
                          ) : (
                            notifications.map((n) => {
                              const meta = getNotificationMeta(n);
                              const badgeIcon =
                                meta.type === "order"
                                  ? "🛒"
                                  : meta.type === "question"
                                    ? "💬"
                                    : meta.type === "review"
                                      ? "⭐"
                                      : meta.type === "delivery_confirm"
                                        ? "📦"
                                        : meta.type === "seller_approved"
                                          ? "✅"
                                      : "🔔";

                              const badgeClass =
                                meta.type === "order"
                                  ? "bg-[#E85D26]/15 text-[#E85D26] border-[#E85D26]/30"
                                  : meta.type === "question"
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                    : meta.type === "review"
                                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                                      : meta.type === "delivery_confirm"
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                        : meta.type === "seller_approved"
                                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                                      : "bg-gray-500/10 text-gray-400 border-gray-500/20";

                              const baseRowClass = `p-3 border-b border-[#2A2A2A] cursor-pointer transition-colors ${n.is_read ? "bg-[#111111] opacity-70" : "bg-[#1A1A1A] hover:bg-[#222222]"}`;
                              const linkRowClass = `${baseRowClass} block no-underline`;
                              const body = (
                                <>
                                  <div className="flex gap-2">
                                    {!n.is_read && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#E85D26] mt-1.5 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeClass}`}
                                        >
                                          {badgeIcon} {meta.badge}
                                        </span>
                                      </div>
                                      <p className="text-xs text-white leading-relaxed">
                                        {n.message}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-1 pl-3.5">
                                    {new Date(
                                      n.created_at,
                                    ).toLocaleDateString()}{" "}
                                    {new Date(n.created_at).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </p>
                                </>
                              );

                              if (meta.href) {
                                return (
                                  <Link
                                    key={n.notification_id}
                                    href={meta.href}
                                    onClick={() => {
                                      if (!n.is_read) {
                                        handleMarkAsRead(n.notification_id);
                                      }
                                      setShowNotifications(false);
                                    }}
                                    className={linkRowClass}
                                  >
                                    {body}
                                  </Link>
                                );
                              }
                              return (
                                <div
                                  key={n.notification_id}
                                  onClick={() =>
                                    !n.is_read &&
                                    handleMarkAsRead(n.notification_id)
                                  }
                                  className={baseRowClass}
                                >
                                  {body}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 text-sm ${pathname?.startsWith("/profile") ? "text-[#E85D26]" : "text-gray-300"} hover:text-[#E85D26] transition-colors`}
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-[#2A2A2A]"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E85D26] to-[#F59E0B] flex items-center justify-center text-xs font-bold text-white">
                      {(user.first_name ||
                        user.username ||
                        "?")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-[#E85D26] font-medium">
                    {user.first_name || user.username}
                  </span>
                </Link>
                {(user.role === "seller" || user.role === "admin") && (
                  <Link
                    href="/dashboard"
                    className={`px-3 py-1.5 text-sm font-medium ${pathname?.startsWith("/dashboard") ? "text-white bg-[#F59E0B]" : "text-[#F59E0B] hover:bg-[#F59E0B]/10"} border border-[#F59E0B]/30 rounded-lg transition-colors`}
                  >
                    Dashboard
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/analytics"
                  className={`px-3 py-1.5 text-sm font-medium ${pathname?.startsWith("/analytics") ? "text-white bg-[#E85D26]" : "text-gray-300 hover:text-[#E85D26]"} rounded-lg transition-colors`}
                >
                  Analytics
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-[#E85D26] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#E85D26] rounded-lg hover:bg-[#D14F1E] transition-colors shadow-md shadow-[#E85D26]/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-400 hover:text-[#E85D26] hover:bg-[#1A1A1A] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-[#1A1A1A] mt-4 pt-4">
            <MobileNavLink href="/" label="Home" />
            <MobileNavLink href="/products" label="Products" />
            {user && (
              <>
                <MobileNavLink href="/cart" label="Cart" />
                <MobileNavLink href="/orders" label="Orders" />
                <MobileNavLink href="/wishlist" label="Wishlist" />
                <MobileNavLink href="/profile" label="Profile" />
                {(user.role === "seller" || user.role === "admin") && (
                  <MobileNavLink href="/dashboard" label="Dashboard" />
                )}
                {user.role === "admin" && (
                  <MobileNavLink href="/admin" label="Admin Panel" />
                )}
              </>
            )}

            <div className="flex flex-col space-y-2 pt-3 mt-3 border-t border-[#1A1A1A]">
              {user ? (
                <>
                  <span className="block px-4 py-2 text-sm text-gray-300">
                    Signed in as{" "}
                    <span className="text-[#E85D26]">
                      {user.first_name || user.username}
                    </span>
                  </span>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-400 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-4 py-2 text-sm font-medium text-gray-300 hover:bg-[#1A1A1A] rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-4 py-2 text-sm font-medium text-white bg-[#E85D26] rounded-lg hover:bg-[#D14F1E] transition-colors text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, label }) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`${isActive ? "text-[#E85D26]" : "text-gray-300"} hover:text-[#E85D26] font-medium transition-colors duration-200`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label }) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`block px-4 py-2.5 ${isActive ? "text-[#E85D26] bg-[#1A1A1A]" : "text-gray-300"} hover:text-[#E85D26] hover:bg-[#1A1A1A] rounded-lg font-medium transition-colors`}
    >
      {label}
    </Link>
  );
}
