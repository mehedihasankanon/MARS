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
  const [pendingSellers, setPendingSellers] = useState([]);
  const [scamReports, setScamReports] = useState([]);
  const [approvingSeller, setApprovingSeller] = useState(null);
  const [updatingReport, setUpdatingReport] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({
    couponCode: '',
    discountPercent: '',
    expiryDate: '',
  });
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponFormError, setCouponFormError] = useState('');
  const [couponActionId, setCouponActionId] = useState(null);

  const [promotingUserId, setPromotingUserId] = useState(null);
  const [removingAdminId, setRemovingAdminId] = useState(null);
  const [promoteError, setPromoteError] = useState('');

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
        const [usersRes, pendingRes, reportsRes, couponsRes] = await Promise.all([
          api.get('/users'),
          api.get('/users/seller-requests'),
          api.get('/reports/scam'),
          api.get('/coupons'),
        ]);
        setUsers(usersRes.data);
        setPendingSellers(pendingRes.data);
        setScamReports(reportsRes.data);
        setCoupons(couponsRes.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const approveSeller = async (sellerId) => {
    setApprovingSeller(sellerId);
    try {
      await api.post(`/users/seller-requests/${sellerId}/approve`);
      const res = await api.get('/users/seller-requests');
      setPendingSellers(res.data);
    } catch (err) {
      console.error('Failed to approve seller:', err);
    } finally {
      setApprovingSeller(null);
    }
  };

  const promoteToAdmin = async (targetUserId) => {
    setPromoteError('');
    setPromotingUserId(targetUserId);
    try {
      await api.post(`/users/${targetUserId}/promote-admin`);
      const usersRes = await api.get('/users');
      setUsers(usersRes.data);
    } catch (err) {
      setPromoteError(
        err.response?.data?.error || 'Failed to promote user.',
      );
    } finally {
      setPromotingUserId(null);
    }
  };

  const removeAdminRole = async (targetUserId) => {
    setPromoteError('');
    if (!window.confirm('Remove admin role from this user?')) return;

    setRemovingAdminId(targetUserId);
    try {
      await api.delete(`/users/${targetUserId}/remove-admin`);
      const usersRes = await api.get('/users');
      setUsers(usersRes.data);
    } catch (err) {
      setPromoteError(
        err.response?.data?.error || 'Failed to remove admin role.',
      );
    } finally {
      setRemovingAdminId(null);
    }
  };

  const createCoupon = async (e) => {
    e.preventDefault();
    setCouponFormError('');
    const pct = Number(couponForm.discountPercent);
    if (!couponForm.couponCode?.trim()) {
      setCouponFormError('Choose a short coupon code customers can remember (e.g. SAVE20).');
      return;
    }
    if (!couponForm.expiryDate) {
      setCouponFormError('Expiry date is required.');
      return;
    }
    if (Number.isNaN(pct) || pct < 1 || pct > 100) {
      setCouponFormError('Discount must be between 1 and 100.');
      return;
    }
    setCouponSubmitting(true);
    try {
      const expiryISO = new Date(couponForm.expiryDate).toISOString();
      await api.post('/coupons', {
        coupon_code: couponForm.couponCode.trim(),
        discount_percent: pct,
        expiry_date: expiryISO,
      });
      setCouponForm({ couponCode: '', discountPercent: '', expiryDate: '' });
      const couponsRes = await api.get('/coupons');
      setCoupons(couponsRes.data);
    } catch (err) {
      setCouponFormError(
        err.response?.data?.error || 'Failed to create coupon.',
      );
    } finally {
      setCouponSubmitting(false);
    }
  };

  const disableCoupon = async (couponId) => {
    setCouponActionId(couponId);
    try {
      await api.put(`/coupons/disable/${couponId}`);
      const couponsRes = await api.get('/coupons');
      setCoupons(couponsRes.data);
    } catch (err) {
      console.error('Failed to disable coupon:', err);
    } finally {
      setCouponActionId(null);
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon? This fails if it was used on orders.')) {
      return;
    }
    setCouponActionId(couponId);
    try {
      await api.delete(`/coupons/${couponId}`);
      const couponsRes = await api.get('/coupons');
      setCoupons(couponsRes.data);
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      alert(err.response?.data?.error || 'Could not delete coupon.');
    } finally {
      setCouponActionId(null);
    }
  };

  const updateScamStatus = async (reportId, status) => {
    setUpdatingReport(reportId);
    try {
      await api.patch(`/reports/scam/${reportId}/status`, { status });
      const res = await api.get('/reports/scam');
      setScamReports(res.data);
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setUpdatingReport(null);
    }
  };

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

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden mb-8">
          <div className="px-6 py-4 bg-[#0D0D0D] border-b border-[#2A2A2A]">
            <h2 className="text-white font-bold">Coupons</h2>
            <p className="text-xs text-gray-500 mt-1">
              Shoppers enter the coupon code at checkout. The internal ID is still stored for orders; share the memorable code with customers.
            </p>
          </div>
          <div className="p-6 border-b border-[#2A2A2A]">
            <form onSubmit={createCoupon} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-3">
                <label className="block text-xs text-gray-500 mb-1">Coupon code</label>
                <input
                  type="text"
                  value={couponForm.couponCode}
                  onChange={(e) =>
                    setCouponForm((f) => ({ ...f, couponCode: e.target.value }))
                  }
                  placeholder="e.g. SAVE20"
                  maxLength={64}
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Discount %</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={couponForm.discountPercent}
                  onChange={(e) =>
                    setCouponForm((f) => ({ ...f, discountPercent: e.target.value }))
                  }
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs text-gray-500 mb-1">Expires</label>
                <input
                  type="datetime-local"
                  value={couponForm.expiryDate}
                  onChange={(e) =>
                    setCouponForm((f) => ({ ...f, expiryDate: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26]"
                />
              </div>
              <div className="sm:col-span-3 flex flex-col gap-2">
                {couponFormError && (
                  <p className="text-xs text-red-400">{couponFormError}</p>
                )}
                <button
                  type="submit"
                  disabled={couponSubmitting}
                  className="px-4 py-2.5 bg-[#E85D26] text-white text-sm font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 transition-colors"
                >
                  {couponSubmitting ? 'Creating…' : 'Add coupon'}
                </button>
              </div>
            </form>
          </div>
          {coupons.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No coupons yet.</div>
          ) : (
            <div className="divide-y divide-[#1A1A1A] max-h-[320px] overflow-y-auto">
              {coupons.map((c) => (
                <div
                  key={c.coupon_id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold tracking-wide">
                      Code: <span className="text-[#E85D26]">{c.coupon_code || c.coupon_id?.slice(0, 8)}</span>
                    </p>
                    <p className="text-xs text-gray-500 font-mono break-all mt-0.5">
                      ID: {c.coupon_id}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {c.discount_percent}% off · expires{' '}
                      {c.expiry_date
                        ? new Date(c.expiry_date).toLocaleString()
                        : '—'}
                      {c.created_by ? ` · by @${c.created_by}` : ''}
                      {(c.is_expired || new Date(c.expiry_date) < new Date()) && (
                        <span className="text-amber-500 ml-2">(expired)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(c.coupon_code || c.coupon_id);
                      }}
                      className="px-3 py-1.5 text-xs bg-[#1A1A1A] border border-[#2A2A2A] text-gray-300 rounded-lg hover:border-[#E85D26]/50"
                    >
                      Copy code
                    </button>
                    {!c.is_expired && new Date(c.expiry_date) >= new Date() && (
                      <button
                        type="button"
                        onClick={() => disableCoupon(c.coupon_id)}
                        disabled={couponActionId === c.coupon_id}
                        className="px-3 py-1.5 text-xs bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-600/30 disabled:opacity-50"
                      >
                        {couponActionId === c.coupon_id ? '…' : 'Disable'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteCoupon(c.coupon_id)}
                      disabled={couponActionId === c.coupon_id}
                      className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden">
              <div className="px-6 py-4 bg-[#0D0D0D] border-b border-[#2A2A2A] flex items-center justify-between">
                <h2 className="text-white font-bold">Seller Approval Requests</h2>
                <span className="text-xs text-gray-500">{pendingSellers.length} pending</span>
              </div>
              {pendingSellers.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No pending seller requests.</div>
              ) : (
                <div className="divide-y divide-[#1A1A1A]">
                  {pendingSellers.map((s) => (
                    <div key={s.seller_id} className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-white text-sm font-medium">@{s.username}</p>
                        <p className="text-xs text-gray-500">{s.email}</p>
                        <p className="text-xs text-gray-600 mt-1">Shop: {s.shop_name || '—'}</p>
                      </div>
                      <button
                        onClick={() => approveSeller(s.seller_id)}
                        disabled={approvingSeller === s.seller_id}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingSeller === s.seller_id ? 'Approving...' : 'Approve'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden">
              <div className="px-6 py-4 bg-[#0D0D0D] border-b border-[#2A2A2A] flex items-center justify-between">
                <h2 className="text-white font-bold">Scam Reports</h2>
                <span className="text-xs text-gray-500">{scamReports.length} total</span>
              </div>
              {scamReports.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">No scam reports.</div>
              ) : (
                <div className="divide-y divide-[#1A1A1A] max-h-[420px] overflow-y-auto">
                  {scamReports.map((r) => (
                    <div key={r.report_id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-white text-sm font-medium">
                            Reporter: <span className="text-gray-300">@{r.reporter_username}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Accused seller: <span className="text-gray-300">{r.accused_seller_username || '—'}</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Order: {r.order_id ? r.order_id.slice(0, 8) : '—'} • Product: {r.product_id ? r.product_id.slice(0, 8) : '—'}
                          </p>
                        </div>
                        <select
                          value={r.status || 'Open'}
                          onChange={(e) => updateScamStatus(r.report_id, e.target.value)}
                          disabled={updatingReport === r.report_id}
                          className="px-3 py-2 text-xs bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-gray-300"
                        >
                          <option value="Open">Open</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Dismissed">Dismissed</option>
                        </select>
                      </div>
                      <div className="mt-3 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Description</p>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{r.description}</p>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-2">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {promoteError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {promoteError}
          </div>
        )}

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

          <div className="hidden md:grid md:grid-cols-7 gap-4 px-6 py-3 bg-[#0D0D0D] text-xs text-gray-500 uppercase tracking-wider font-medium">
            <span>User</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Role</span>
            <span>Last Login</span>
            <span>Joined</span>
            <span className="text-right">Actions</span>
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
                  className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 px-6 py-4 hover:bg-[#1A1A1A]/50 transition-colors"
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

                  <div className="flex items-center md:justify-end">
                    {u.role !== 'admin' ? (
                      <button
                        type="button"
                        onClick={() => promoteToAdmin(u.user_id)}
                        disabled={promotingUserId === u.user_id}
                        className="px-3 py-1.5 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {promotingUserId === u.user_id ? 'Promoting…' : 'Make admin'}
                      </button>
                    ) : u.user_id === user?.user_id ? (
                      <span className="text-xs text-gray-600">You</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeAdminRole(u.user_id)}
                        disabled={removingAdminId === u.user_id}
                        className="px-3 py-1.5 text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {removingAdminId === u.user_id ? 'Removing…' : 'Remove admin'}
                      </button>
                    )}
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
