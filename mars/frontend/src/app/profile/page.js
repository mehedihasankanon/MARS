'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, loading, logout, becomeSeller, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [showSellerModal, setShowSellerModal] = useState(false);
  const [shopName, setShopName] = useState('');
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerError, setSellerError] = useState('');
  const [sellerSuccess, setSellerSuccess] = useState('');

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [pictureError, setPictureError] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ house: '', streetRoad: '', city: '', zipCode: '', addressType: 'Shipping' });
  const [addressError, setAddressError] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        setAddresses(res.data);
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setAddressLoading(false);
      }
    };
    fetchAddresses();
  }, [user]);

  const handleAddressSave = async () => {
    setAddressError('');
    if (!addressForm.streetRoad || !addressForm.city || !addressForm.zipCode) {
      setAddressError('Street, city, and zip code are required.');
      return;
    }
    try {
      if (editingAddress) {
        const res = await api.put(`/addresses/${editingAddress.address_id}`, addressForm);
        setAddresses(addresses.map(a => a.address_id === editingAddress.address_id ? res.data : a));
      } else {
        const res = await api.post('/addresses', addressForm);
        setAddresses([...addresses, res.data]);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({ house: '', streetRoad: '', city: '', zipCode: '', addressType: 'Shipping' });
    } catch (err) {
      setAddressError(err.response?.data?.error || 'Failed to save address.');
    }
  };

  const handleAddressDelete = async (addressId) => {
    try {
      await api.delete(`/addresses/${addressId}`);
      setAddresses(addresses.filter(a => a.address_id !== addressId));
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

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

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPictureError('Please select a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPictureError('Image must be under 5MB.');
      return;
    }

    setUploadingPicture(true);
    setPictureError('');
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await api.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser({ profile_picture: res.data.profile_picture });
    } catch (err) {
      setPictureError(err.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePicture = async () => {
    setUploadingPicture(true);
    setPictureError('');
    try {
      await api.delete('/users/profile/picture');
      updateUser({ profile_picture: null });
    } catch (err) {
      setPictureError(err.response?.data?.error || 'Failed to remove image.');
    } finally {
      setUploadingPicture(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            <div className="relative group flex-shrink-0">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#2A2A2A]"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#E85D26] to-[#F59E0B] rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {(user.first_name || user.username || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                className="absolute inset-0 w-20 h-20 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-wait"
              >
                {uploadingPicture ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePictureUpload}
                className="hidden"
              />

              {user.profile_picture && !uploadingPicture && (
                <button
                  onClick={handleRemovePicture}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400"
                  title="Remove picture"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
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

              {pictureError && (
                <p className="text-red-400 text-xs mt-2">{pictureError}</p>
              )}
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

            {user.role === 'seller' && user.shop_name && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Shop Name</p>
                <p className="text-white">{user.shop_name}</p>
              </div>
            )}

            {user.role === 'seller' && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Seller Rating</p>
                {user.seller_rating > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-4 h-4 ${star <= Math.round(parseFloat(user.seller_rating)) ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-white text-sm">{parseFloat(user.seller_rating).toFixed(1)}</span>
                  </div>
                ) : (
                  <p className="text-gray-500">No ratings yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
          <h2 className="text-lg font-bold text-white mb-6">Change Password</h2>
          
          {passwordError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Password</label>
              <input 
                type="password" required value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E85D26]" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password</label>
              <input 
                type="password" required value={passwordForm.newPassword}
                onChange={e => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E85D26]" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
              <input 
                type="password" required value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                className="w-full px-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#E85D26]" 
              />
            </div>
            <button 
              type="submit" disabled={passwordLoading}
              className="px-4 py-2 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 transition-colors"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">My Addresses</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setAddressForm({ house: '', streetRoad: '', city: '', zipCode: '', addressType: 'Shipping' });
                setAddressError('');
                setShowAddressForm(true);
              }}
              className="px-4 py-2 text-sm bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
            >
              + Add Address
            </button>
          </div>

          {addressLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-[#1A1A1A] rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-[#2A2A2A] rounded w-2/3 mb-2" />
                  <div className="h-3 bg-[#2A2A2A] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <p className="text-gray-500 text-sm">No addresses saved yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div key={addr.address_id} className="flex items-start justify-between p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
                  <div>
                    <p className="text-gray-200 text-sm">
                      {addr.house && `${addr.house}, `}{addr.street_road}
                    </p>
                    <p className="text-gray-500 text-xs">{addr.city}, {addr.zip_code}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-[#2A2A2A] text-gray-400">
                      {addr.address_type}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingAddress(addr);
                        setAddressForm({
                          house: addr.house || '',
                          streetRoad: addr.street_road || '',
                          city: addr.city || '',
                          zipCode: addr.zip_code || '',
                          addressType: addr.address_type || 'Shipping',
                        });
                        setAddressError('');
                        setShowAddressForm(true);
                      }}
                      className="text-gray-400 hover:text-[#E85D26] transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAddressDelete(addr.address_id)}
                      className="text-gray-400 hover:text-red-400 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAddressForm && (
            <div className="mt-4 p-4 bg-[#0D0D0D] rounded-lg border border-[#2A2A2A]">
              <h3 className="text-sm font-medium text-white mb-3">
                {editingAddress ? 'Edit Address' : 'New Address'}
              </h3>
              {addressError && (
                <p className="text-red-400 text-xs mb-3">{addressError}</p>
              )}
              <div className="space-y-3">
                <input
                  type="text"
                  value={addressForm.house}
                  onChange={(e) => setAddressForm({ ...addressForm, house: e.target.value })}
                  placeholder="House / Apt #"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
                <input
                  type="text"
                  value={addressForm.streetRoad}
                  onChange={(e) => setAddressForm({ ...addressForm, streetRoad: e.target.value })}
                  placeholder="Street / Road *"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="City *"
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    placeholder="Zip Code *"
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  />
                </div>
                <select
                  value={addressForm.addressType}
                  onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                >
                  <option value="Shipping">Shipping</option>
                  <option value="Billing">Billing</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddressSave}
                    className="px-4 py-2 text-sm bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
                  >
                    {editingAddress ? 'Update' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}
                    className="px-4 py-2 text-sm text-gray-400 border border-[#2A2A2A] rounded-lg hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
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

            {(user.role === 'seller' || user.role === 'admin') && (
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

        {user.role === 'customer' && (
          <div className="bg-gradient-to-r from-[#E85D26]/10 to-[#F59E0B]/10 rounded-xl border border-[#E85D26]/30 p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Want to start selling?</h2>
                <p className="text-gray-400 text-sm">
                  Become a seller and list your own products on MARS. You'll still be able to shop as a buyer!
                </p>
              </div>
              <button
                onClick={() => setShowSellerModal(true)}
                className="px-6 py-3 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] transition-colors shadow-lg shadow-[#E85D26]/20 whitespace-nowrap"
              >
                Become a Seller
              </button>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full py-3 text-red-400 hover:text-red-300 border border-[#2A2A2A] hover:border-red-800 rounded-xl transition-colors text-sm font-medium"
        >
          Sign Out
        </button>

        {showSellerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-2">
                Become a <span className="text-[#E85D26]">Seller</span>
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Set up your seller profile. You can optionally provide a shop name.
              </p>

              {sellerError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {sellerError}
                </div>
              )}
              {sellerSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                  {sellerSuccess}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-300 mb-1">
                  Shop Name <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. My Awesome Shop"
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSellerModal(false);
                    setShopName('');
                    setSellerError('');
                    setSellerSuccess('');
                  }}
                  disabled={sellerLoading}
                  className="flex-1 py-3 text-gray-400 border border-[#2A2A2A] rounded-lg hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setSellerLoading(true);
                    setSellerError('');
                    try {
                      await becomeSeller(shopName);
                      setSellerSuccess('You are now a seller! Redirecting...');
                      setTimeout(() => {
                        setShowSellerModal(false);
                        router.push('/dashboard');
                      }, 1500);
                    } catch (err) {
                      setSellerError(err.response?.data?.error || 'Failed to become a seller.');
                    } finally {
                      setSellerLoading(false);
                    }
                  }}
                  disabled={sellerLoading}
                  className="flex-1 py-3 bg-[#E85D26] text-white font-semibold rounded-lg hover:bg-[#D14F1E] transition-colors disabled:opacity-50"
                >
                  {sellerLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
