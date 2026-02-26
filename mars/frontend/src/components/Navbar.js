'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Navbar Component — Now auth-aware!
 *
 * Uses useAuth() to check if a user is logged in.
 * - Logged out: shows Login / Sign Up buttons
 * - Logged in: shows username and Logout button
 */
export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    // NAVBAR CONTAINER: Sticky top navigation
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* NAVBAR CONTENT: Flex layout for spacing */}
        <div className="flex justify-between items-center h-16">
          
          {/* LOGO/BRAND SECTION */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              MARS
            </Link>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Marketplace & Retailing System
            </p>
          </div>

          {/* DESKTOP NAVIGATION: Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" label="Home" />
            <NavLink href="/products" label="Products" />
            <NavLink href="/about" label="About" />
            <NavLink href="/contact" label="Contact" />
          </div>

          {/* AUTH/USER SECTION: Desktop buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? null : user ? (
              <>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Hi, {user.first_name || user.username}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON: Shows only on mobile */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {/* HAMBURGER ICON */}
              {isMobileMenuOpen ? (
                // X ICON (when menu is open)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // HAMBURGER ICON (when menu is closed)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU: Only shows when isMobileMenuOpen is true */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 dark:border-gray-800 mt-4 pt-4">
            <MobileNavLink href="/" label="Home" />
            <MobileNavLink href="/products" label="Products" />
            <MobileNavLink href="/about" label="About" />
            <MobileNavLink href="/contact" label="Contact" />
            <div className="flex flex-col space-y-2 pt-2">
              {user ? (
                <>
                  <span className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                    Hi, {user.first_name || user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/auth/login"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
 * NavLink Component (Desktop)
 * 
 * This is a REUSABLE component for nav links.
 * Instead of repeating the same code 4 times, we create a component
 * and use it multiple times with different props.
 * 
 * Props:
 * - href: the link destination (e.g., "/products")
 * - label: the text to display (e.g., "Products")
 */
function NavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
    >
      {label}
    </Link>
  );
}

/**
 * MobileNavLink Component
 * 
 * Same as NavLink but styled for mobile (block-level, padding).
 * Different styling for different screen sizes = responsive design.
 */
function MobileNavLink({ href, label }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
    >
      {label}
    </Link>
  );
}
