'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * CATEGORIES PAGE — /categories
 *
 * Displays all product categories from the dedicated /api/categories endpoint.
 * If the logged-in user is an admin, an "Add Category" form is shown at the top.
 *
 * DATA FLOW:
 *   GET  /api/categories          → public, returns all categories
 *   POST /api/categories          → admin only, creates a new category
 *     Body: { name, description, parentCategoryId }
 *
 * SCHEMA (Categories table):
 *   Category_ID, Name (UNIQUE), Description, Image, Last_Updated_at,
 *   Parent_Category_ID (self-FK), Updated_By_Admin_ID (FK → Admins)
 */
export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Admin form state ───────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parentCategoryId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  /** Fetch categories from the dedicated endpoint */
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /** Admin: create a new category */
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/categories', {
        name: form.name.trim(),
        description: form.description.trim() || null,
        parentCategoryId: form.parentCategoryId || null,
      });
      setFormSuccess(`Category "${form.name}" created!`);
      setForm({ name: '', description: '', parentCategoryId: '' });
      // Refresh the list
      await fetchCategories();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Categories</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 animate-pulse">
                <div className="h-5 bg-[#1A1A1A] rounded w-2/3 mb-2" />
                <div className="h-4 bg-[#1A1A1A] rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-[#E85D26]">Categories</span>
          </h1>
          {/* Admin-only: toggle the add form */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 text-sm font-medium bg-[#E85D26] text-white rounded-lg hover:bg-[#D14F1E] transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add Category'}
            </button>
          )}
        </div>
        <p className="text-gray-400 mb-8">Browse products by category.</p>

        {/* ── ADMIN: Add Category Form ────────────────── */}
        {showForm && user?.role === 'admin' && (
          <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              New Category
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAddCategory} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="catName" className="block text-sm text-gray-300 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="catName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={50}
                  placeholder="e.g. Electronics"
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="catDesc" className="block text-sm text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="catDesc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description..."
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent resize-none"
                />
              </div>

              {/* Parent Category (optional) */}
              {categories.length > 0 && (
                <div>
                  <label htmlFor="parentCat" className="block text-sm text-gray-300 mb-1">
                    Parent Category <span className="text-gray-500">(optional — makes this a sub-category)</span>
                  </label>
                  <select
                    id="parentCat"
                    value={form.parentCategoryId}
                    onChange={(e) => setForm({ ...form, parentCategoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  >
                    <option value="">None (top-level category)</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          </div>
        )}

        {/* ── CATEGORIES GRID ─────────────────────────── */}
        {categories.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-5xl block mb-4">📂</span>
            <h2 className="text-xl font-bold text-white mb-2">No categories yet</h2>
            <p className="text-gray-400">
              {user?.role === 'admin'
                ? 'Click "+ Add Category" above to create the first one.'
                : 'Categories will appear once an admin creates them.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 hover:border-[#E85D26]/50 transition-all"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-[#E85D26] transition-colors mb-1">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{cat.description}</p>
                )}
                {cat.parent_name && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#1A1A1A] text-gray-400">
                    Sub of: {cat.parent_name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
