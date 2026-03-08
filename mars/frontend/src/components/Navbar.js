'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, logout, loading } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {loading ? null : user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#E85D26] transition-colors"
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-[#2A2A2A]"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E85D26] to-[#F59E0B] flex items-center justify-center text-xs font-bold text-white">
                      {(user.first_name || user.username || '?')[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-[#E85D26] font-medium">{user.first_name || user.username}</span>
                </Link>
                {(user.role === 'seller' || user.role === 'admin') && (
                  <Link
                    href="/dashboard"
                    className="px-3 py-1.5 text-sm font-medium text-[#F59E0B] border border-[#F59E0B]/30 rounded-lg hover:bg-[#F59E0B]/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                <MobileNavLink href="/profile" label="Profile" />
                {(user.role === 'seller' || user.role === 'admin') && (
                  <MobileNavLink href="/dashboard" label="Dashboard" />
                )}
                {user.role === 'admin' && (
                  <MobileNavLink href="/admin" label="Admin Panel" />
                )}
              </>
            )}

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
