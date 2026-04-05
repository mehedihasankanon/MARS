'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image: '', parentCategoryId: '' });
  const [createImageFile, setCreateImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', image: '', parentCategoryId: '' });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

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
      const payload = new FormData();
      payload.append('name', form.name.trim());
      if (form.description.trim()) payload.append('description', form.description.trim());
      if (form.parentCategoryId) payload.append('parentCategoryId', form.parentCategoryId);
      if (createImageFile) {
        payload.append('imageFile', createImageFile);
      } else if (form.image.trim()) {
        payload.append('image', form.image.trim());
      }

      await api.post('/categories', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormSuccess(`Category "${form.name}" created!`);
      setForm({ name: '', description: '', image: '', parentCategoryId: '' });
      setCreateImageFile(null);

      await fetchCategories();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCategory = (cat) => {
    setFormError('');
    setFormSuccess('');
    setEditingCategory(cat);
    setEditImageFile(null);
    setEditForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      parentCategoryId: cat.parent_category_id || '',
    });
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setFormError('');
    setFormSuccess('');

    if (!editForm.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setEditSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('name', editForm.name.trim());
      if (editForm.description.trim()) payload.append('description', editForm.description.trim());
      if (editForm.parentCategoryId) payload.append('parentCategoryId', editForm.parentCategoryId);
      if (editImageFile) {
        payload.append('imageFile', editImageFile);
      } else if (editForm.image.trim()) {
        payload.append('image', editForm.image.trim());
      }

      await api.put(`/categories/${encodeURIComponent(editingCategory.name)}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormSuccess(`Category "${editForm.name}" updated.`);
      setEditingCategory(null);
      setEditImageFile(null);
      await fetchCategories();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to update category.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    setFormError('');
    setFormSuccess('');
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;

    setDeletingCategoryId(cat.category_id);
    try {
      await api.delete(`/categories/${encodeURIComponent(cat.name)}`);
      setFormSuccess(`Category "${cat.name}" deleted.`);
      if (editingCategory?.category_id === cat.category_id) {
        setEditingCategory(null);
      }
      await fetchCategories();
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to delete category.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

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

              <div>
                <label htmlFor="catImage" className="block text-sm text-gray-300 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  id="catImageFile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setCreateImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-3 file:border-0 file:rounded-md file:bg-[#E85D26] file:text-white hover:file:bg-[#D14F1E]"
                />
                <p className="text-xs text-gray-500 mt-1">Upload from your PC, or use an image URL below.</p>
              </div>

              <div>
                <label htmlFor="catImage" className="block text-sm text-gray-300 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="catImage"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>

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

        {editingCategory && user?.role === 'admin' && (
          <div className="bg-[#111111] rounded-xl border border-[#2A2A2A] p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Edit Category</h2>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label htmlFor="editCatName" className="block text-sm text-gray-300 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="editCatName"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  maxLength={50}
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="editCatDesc" className="block text-sm text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="editCatDesc"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label htmlFor="editCatImage" className="block text-sm text-gray-300 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  id="editCatImageFile"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-3 file:border-0 file:rounded-md file:bg-[#E85D26] file:text-white hover:file:bg-[#D14F1E]"
                />
                <p className="text-xs text-gray-500 mt-1">Choose a new image from your PC to replace current image.</p>
              </div>

              <div>
                <label htmlFor="editCatImage" className="block text-sm text-gray-300 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="editCatImage"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label htmlFor="editParentCat" className="block text-sm text-gray-300 mb-1">
                    Parent Category
                  </label>
                  <select
                    id="editParentCat"
                    value={editForm.parentCategoryId}
                    onChange={(e) => setEditForm({ ...editForm, parentCategoryId: e.target.value })}
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#E85D26] focus:border-transparent"
                  >
                    <option value="">None (top-level category)</option>
                    {categories
                      .filter((cat) => cat.category_id !== editingCategory.category_id)
                      .map((cat) => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-3 bg-[#E85D26] text-white font-medium rounded-lg hover:bg-[#D14F1E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setEditImageFile(null);
                  }}
                  className="px-6 py-3 bg-[#1A1A1A] text-gray-300 font-medium rounded-lg hover:bg-[#222222] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-20 bg-[#111111] rounded-xl border border-[#2A2A2A]">
            <span className="text-5xl block mb-4"></span>
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
                href={`/products?category=${encodeURIComponent(cat.category_id)}`}
                className="group bg-[#111111] rounded-xl border border-[#2A2A2A] overflow-hidden hover:border-[#E85D26]/50 transition-all"
              >
                <div className="h-36 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] overflow-hidden relative">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">📁</div>
                  )}

                  {user?.role === 'admin' && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditCategory(cat);
                        }}
                        className="px-2 py-1 text-xs bg-black/70 text-gray-100 rounded hover:bg-black/85"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteCategory(cat);
                        }}
                        disabled={deletingCategoryId === cat.category_id}
                        className="px-2 py-1 text-xs bg-red-700/80 text-red-100 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingCategoryId === cat.category_id ? '...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
