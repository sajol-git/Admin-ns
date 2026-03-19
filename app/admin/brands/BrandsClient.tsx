'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Loader2, Image as ImageIcon, Search, Globe } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Brand } from '@/types';
import CloudinaryUpload from '@/components/CloudinaryUpload';

export default function BrandsClient({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', image_url: '' });
  
  const supabase = createClient();
  const router = useRouter();

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({ 
        name: brand.name, 
        slug: brand.slug, 
        image_url: brand.image_url || '' 
      });
    } else {
      setEditingBrand(null);
      setFormData({ name: '', slug: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormData({ name: '', slug: '', image_url: '' });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(formData)
          .eq('id', editingBrand.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([formData]);
        if (error) throw error;
      }

      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      if (data) setBrands(data);
      handleCloseModal();
      router.refresh();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      setError(`Error saving brand: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', deleteConfirmId);
      if (error) throw error;

      setBrands(brands.filter(b => b.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError('Error deleting brand. It might be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <Globe className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Brand Management</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Brands</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage and organize your product brands.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Brand
          </button>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50 text-gray-400 uppercase tracking-[0.2em] text-[10px] font-black">
                <th className="p-8">Logo</th>
                <th className="p-8">Brand Details</th>
                <th className="p-8">Slug</th>
                <th className="p-8">Created At</th>
                <th className="p-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredBrands.map((brand) => (
                  <motion.tr 
                    key={brand.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-indigo-50/30 transition-all group"
                  >
                    <td className="p-8">
                      {brand.image_url ? (
                        <div className="relative h-14 w-14 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm group-hover:shadow-md transition-all group-hover:scale-110 group-hover:rotate-2">
                          <Image 
                            src={brand.image_url} 
                            alt={brand.name} 
                            fill
                            className="object-contain p-2"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                          {brand.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Official Partner</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <code className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-mono font-bold">
                        {brand.slug}
                      </code>
                    </td>
                    <td className="p-8 text-gray-500 font-bold text-xs uppercase tracking-wider">
                      {brand.created_at ? new Date(brand.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={() => handleOpenModal(brand)}
                          className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all active:scale-90"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="h-24 w-24 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100 shadow-inner">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-gray-900 uppercase tracking-widest">No brands found</p>
                        <p className="text-sm text-gray-500 font-medium">Try adjusting your search or add a new brand.</p>
                      </div>
                      <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-indigo-600 px-8 py-3.5 text-sm font-black text-white hover:bg-indigo-700 transition-all rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95"
                      >
                        <Plus className="h-5 w-5" />
                        Create Your First Brand
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100"
            >
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {editingBrand ? 'Edit Brand' : 'New Brand'}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {editingBrand ? 'Update brand details and logo.' : 'Add a new brand to your catalog.'}
                  </p>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  className="rounded-2xl p-3 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-90"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 px-5 py-4 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                      placeholder="e.g. Nike"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 bg-gray-100/50 px-5 py-4 text-sm text-gray-500 focus:outline-none transition-all font-mono font-bold"
                      placeholder="e.g. nike"
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      Brand Logo
                    </label>
                    <div className="rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/30 p-2">
                      <CloudinaryUpload
                        label=""
                        value={formData.image_url}
                        onChange={(url) => setFormData({ ...formData, image_url: url })}
                        onRemove={() => setFormData({ ...formData, image_url: '' })}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 rounded-2xl bg-gray-50 px-6 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )}
                    {editingBrand ? 'Update Brand' : 'Create Brand'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 text-center"
            >
              <div className="mx-auto w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                <Trash2 className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Delete Brand?</h3>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                This action cannot be undone. If this brand is linked to products, deletion might fail.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-4 text-sm font-bold text-gray-500 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-4 text-sm font-black text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] w-full max-w-md px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-xl">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-sm font-bold">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
