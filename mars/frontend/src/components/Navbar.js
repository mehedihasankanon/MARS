'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * =====================================================================
 * NAVBAR COMPONENT — Top navigation bar (appears on every page)
 * =====================================================================
 *
 * This component is "auth-aware" — it checks if a user is logged in
 * and shows different buttons based on that.
 *
 * BEHAVIOR:
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  LOGGED OUT:   Logo | Home Products | Login SignUp                       │
 * │  LOGGED IN:    Logo | Home Products | Cart Orders Profile [Dashboard] Logout │
 * └──────────────────────────────────────────────────────────────────────┘
 * [Dashboard] only shows for sellers/admins
 *
 * RESPONSIVE DESIGN:
 * - Desktop (md+): Full horizontal nav with all links visible
 * - Mobile (<md):  Logo + hamburger button → expandable menu
 *
 * HOOKS USED:
 * - useState: Controls mobile menu open/close toggle
 * - useAuth:  Gets user data and logout function from AuthContext
 * =====================================================================
 */
export default function Navbar() {
  // isMobileMenuOpen: tracks if the hamburger menu is expanded (mobile only)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Destructure auth state from the global AuthContext
  // user = logged-in user object (or null if logged out)
  // logout = function to clear session and redirect
  // loading = true while checking if a saved token exists
  const { user, logout, loading } = useAuth();

  // Toggle function — flips the mobile menu between open/closed
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    /* ── NAVBAR CONTAINER ──────────────────────────────────
       sticky top-0 = stays fixed at the top when scrolling
       z-50 = sits above all other content (z-index: 50)
       border-b = thin bottom border for visual separation
       backdrop-blur = semi-transparent glass effect
       ─────────────────────────────────────────────────── */
    <nav className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#1A1A1A] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── NAVBAR ROW: Logo (left) | Nav Links (center) | Auth (right) ── */}
        <div className="flex justify-between items-center h-16">
          
          {/* ── LOGO / BRAND SECTION (left side) ────────────
               Shows the MARS logo image + text branding
               Links back to homepage when clicked
               ─────────────────────────────────────────── */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Logo image from public/mars-logo.svg */}
              <Image
                src="/mars-logo.png"
                alt="MARS logo"
                width={40}
                height={45}
                className="rounded-lg"
              />
              {/* Brand text — name + subtitle */}
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

          {/* ── DESKTOP NAVIGATION LINKS (center) ────────────
               hidden md:flex = HIDDEN on mobile, VISIBLE on desktop
               These are the main page links.
               When logged in, more links appear (Cart, Orders, etc.)
               ──────────────────────────────────────────── */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" label="Home" />
            <NavLink href="/products" label="Products" />
            {user && (
              <>
                <NavLink href="/cart" label="Cart" />
                <NavLink href="/orders" label="Orders" />
              </>
            )}
          </div>

          {/* ── AUTH / USER SECTION (right side, desktop) ─────
               Shows different content based on login state:
               - loading: show nothing (prevents flash)
               - logged in: greeting + logout button
               - logged out: login link + sign up button
               ──────────────────────────────────────────── */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? null : user ? (
              /* ── LOGGED IN: Profile link + Dashboard (sellers) + Logout ── */
              <>
                <Link
                  href="/profile"
                  className="text-sm text-gray-300 hover:text-[#E85D26] transition-colors"
                >
                  <span className="text-[#E85D26] font-medium">{user.first_name || user.username}</span>
                </Link>
                {/* Dashboard link — only for sellers and admins */}
                {(user.role === 'seller' || user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 text-sm font-medium text-[#F59E0B] border border-[#F59E0B]/30 rounded-lg hover:bg-[#F59E0B]/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Admin Panel link — only for admins */}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-3 py-1.5 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              /* ── LOGGED OUT: Show Login + Sign Up ── */
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

          {/* ── MOBILE MENU BUTTON (hamburger icon) ──────────
               md:hidden = ONLY visible on mobile screens
               Toggles the mobile dropdown menu on/off
               Shows "X" when open, "≡" (hamburger) when closed
               ──────────────────────────────────────────── */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-400 hover:text-[#E85D26] hover:bg-[#1A1A1A] rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                /* X icon — shown when menu is open (click to close) */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger icon — shown when menu is closed (click to open) */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── MOBILE DROPDOWN MENU ────────────────────────────
             Only renders when isMobileMenuOpen is true.
             Shows all nav links + auth buttons in a vertical list.
             This entire block is hidden on desktop (md:hidden parent).
             ──────────────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-[#1A1A1A] mt-4 pt-4">
            {/* Navigation links */}
            <MobileNavLink href="/" label="Home" />
            <MobileNavLink href="/products" label="Products" />
            {user && (
              <>
                <MobileNavLink href="/cart" label="Cart" />
                <MobileNavLink href="/orders" label="Orders" />
                <MobileNavLink href="/profile" label="Profile" />
                {(user.role === 'seller' || user.role === 'admin') && (
                  <MobileNavLink href="/dashboard" label="Dashboard" />
                )}
                {user.role === 'admin' && (
                  <MobileNavLink href="/admin" label="Admin Panel" />
                )}
              </>
            )}

            {/* Auth section — separated with spacing */}
            <div className="flex flex-col space-y-2 pt-3 mt-3 border-t border-[#1A1A1A]">
              {user ? (
                <>
                  <span className="block px-4 py-2 text-sm text-gray-300">
                    Signed in as <span className="text-[#E85D26]">{user.first_name || user.username}</span>
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

/**
 * ── NavLink Component (Desktop) ──────────────────────────────
 * A REUSABLE component for desktop navigation links.
 * Instead of writing the same <Link> with the same classes 4 times,
 * we define it once and reuse it with different props.
 *
 * Props:
 *   href  — the URL to navigate to (e.g., "/products")
 *   label — the text to display (e.g., "Products")
 *
 * Usage: <NavLink href="/products" label="Products" />
 * ─────────────────────────────────────────────────────────────── */
function NavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="text-gray-300 hover:text-[#E85D26] font-medium transition-colors duration-200"
    >
      {label}
    </Link>
  );
}

/**
 * ── MobileNavLink Component ──────────────────────────────────
 * Same purpose as NavLink but styled differently for mobile:
 * - block display (full-width, stacked vertically)
 * - larger touch target with padding
 * - background highlight on hover
 *
 * Props: same as NavLink (href + label)
 * ─────────────────────────────────────────────────────────────── */
function MobileNavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2.5 text-gray-300 hover:text-[#E85D26] hover:bg-[#1A1A1A] rounded-lg font-medium transition-colors"
    >
      {label}
    </Link>
  );
}
