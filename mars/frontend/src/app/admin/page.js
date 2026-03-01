'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);           
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === '' ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'All' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    sellers: users.filter((u) => u.role === 'seller').length,
    customers: users.filter((u) => u.role === 'customer').length,
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'text-red-400 bg-red-400/10',
      seller: 'text-[#F59E0B] bg-[#F59E0B]/10',
      customer: 'text-green-400 bg-green-400/10',
    };
    return styles[role] || 'text-gray-400 bg-gray-400/10';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Admin Panel</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5 animate-pulse">
                <div className="h-4 bg-[#1A1A1A] rounded w-20 mb-2" />
                <div className="h-8 bg-[#1A1A1A] rounded w-12" />
              </div>
            ))}
          </div>
          <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
            <div className="h-6 bg-[#1A1A1A] rounded w-48 mb-4" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#1A1A1A] rounded w-full mb-2" />
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
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Admin <span className="text-[#E85D26]">Panel</span>
          </h1>
          <p className="text-gray-400">
            Manage users and monitor platform activity.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.total, color: 'text-white' },
            { label: 'Admins', value: stats.admins, color: 'text-red-400' },
            { label: 'Sellers', value: stats.sellers, color: 'text-[#F59E0B]' },
            { label: 'Customers', value: stats.customers, color: 'text-green-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-5"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className={`text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">

          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-[#111111] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="customer">Customer</option>
          </select>
        </div>

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden">

          <div className="hidden md:grid md:grid-cols-6 gap-4 px-6 py-3 bg-[#0D0D0D] text-xs text-gray-500 uppercase tracking-wider font-medium">
            <span>User</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Role</span>
            <span>Last Login</span>
            <span>Joined</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]">
              {filteredUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 px-6 py-4 hover:bg-[#1A1A1A]/50 transition-colors"
                >

                  <div>
                    <p className="text-white font-medium text-sm">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-gray-500 text-xs">@{u.username}</p>
                  </div>

                  <div className="flex items-center">
                    <p className="text-gray-300 text-sm truncate">{u.email}</p>
                  </div>

                  <div className="flex items-center">
                    <p className="text-gray-400 text-sm">{u.phone_number || '—'}</p>
                  </div>

                  <div className="flex items-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <p className="text-gray-500 text-xs">
                      {u.last_login
                        ? new Date(u.last_login).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Never'}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <p className="text-gray-500 text-xs">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-3">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>
    </div>
  );
}
