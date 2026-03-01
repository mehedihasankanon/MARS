'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 bg-[#1A1A1A] rounded-full" />
              <div className="space-y-3">
                <div className="h-6 bg-[#1A1A1A] rounded w-48" />
                <div className="h-4 bg-[#1A1A1A] rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roleConfig = {
    customer: { label: 'Customer',  emoji: '', color: 'text-green-400 bg-green-400/10' },
    seller:   { label: 'Seller',    emoji: '', color: 'text-blue-400 bg-blue-400/10'   },
    admin:    { label: 'Admin',     emoji: '', color: 'text-purple-400 bg-purple-400/10' },
  };
  const role = roleConfig[user.role] || roleConfig.customer;

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            <div className="w-20 h-20 bg-gradient-to-br from-[#E85D26] to-[#F59E0B] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">
                {(user.first_name || user.username || '?')[0].toUpperCase()}
              </span>
            </div>

            <div className="text-center sm:text-left">

              <h1 className="text-2xl font-bold text-white">
                {user.first_name} {user.last_name || ''}
              </h1>

              <p className="text-gray-400">@{user.username}</p>

              <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium ${role.color}`}>
                <span>{role.emoji}</span>
                {role.label}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
          <h2 className="text-lg font-bold text-white mb-6">Account Details</h2>

          <div className="grid sm:grid-cols-2 gap-6">

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Username</p>
              <p className="text-white">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-white">{user.phone_number || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Member Since</p>
              <p className="text-white">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
          <h2 className="text-lg font-bold text-white mb-6">Quick Actions</h2>

          <div className="grid sm:grid-cols-2 gap-4">

            <Link
              href="/orders"
              className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all group"
            >
              <span className="text-2xl"></span>
              <div>
                <p className="text-white font-medium group-hover:text-[#E85D26] transition-colors">My Orders</p>
                <p className="text-gray-500 text-sm">View order history</p>
              </div>
            </Link>

            {user.role === 'customer' && (
              <Link
                href="/cart"
                className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all group"
              >
                <span className="text-2xl"></span>
                <div>
                  <p className="text-white font-medium group-hover:text-[#E85D26] transition-colors">Shopping Cart</p>
                  <p className="text-gray-500 text-sm">View your cart</p>
                </div>
              </Link>
            )}

            {user.role === 'seller' && (
              <Link
                href="/dashboard"
                className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all group"
              >
                <span className="text-2xl"></span>
                <div>
                  <p className="text-white font-medium group-hover:text-[#E85D26] transition-colors">Seller Dashboard</p>
                  <p className="text-gray-500 text-sm">Manage your products</p>
                </div>
              </Link>
            )}

            <Link
              href="/products"
              className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] hover:border-[#E85D26]/40 transition-all group"
            >
              <span className="text-2xl"></span>
              <div>
                <p className="text-white font-medium group-hover:text-[#E85D26] transition-colors">Browse Products</p>
                <p className="text-gray-500 text-sm">Explore the marketplace</p>
              </div>
            </Link>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-3 text-red-400 hover:text-red-300 border border-[#2A2A2A] hover:border-red-800 rounded-xl transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
