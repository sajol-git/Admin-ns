'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Brand } from '@/types';
import CloudinaryUpload from '@/components/CloudinaryUpload';

export default function BrandsClient({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', image_url: '' });
  
  const supabase = createClient();
  const router = useRouter();

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

      // Refresh data
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
      alert(`Error saving brand: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      if (error) throw error;

      setBrands(brands.filter(b => b.id !== id));
      router.refresh();
    } catch (error) {
      console.error('Error deleting brand:', error);
      alert('Error deleting brand. It might be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-3xl font-bold uppercase tracking-tighter">Brands</h1>
          <p className="font-mono text-sm text-ink/60">Manage product brands</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-ink px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider text-bg hover:bg-ink/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Brand
        </button>
      </div>

      <div className="border border-line bg-bg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-line bg-line/5 uppercase tracking-wider">
                <th className="p-4 font-bold">Logo</th>
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Slug</th>
                <th className="p-4 font-bold">Created At</th>
                <th className="p-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-b border-line hover:bg-line/5 transition-colors">
                  <td className="p-4">
                    {brand.image_url ? (
                      <img 
                        src={brand.image_url} 
                        alt={brand.name} 
                        className="h-10 w-10 object-contain border border-line bg-white"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center border border-line bg-line/5">
                        <ImageIcon className="h-4 w-4 opacity-20" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-bold">{brand.name}</td>
                  <td className="p-4 text-ink/60">{brand.slug}</td>
                  <td className="p-4 text-ink/60">
                    {brand.created_at ? new Date(brand.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(brand)}
                        className="p-2 hover:bg-line/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-ink/40">
                    No brands found. Create your first one.
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
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md border border-line bg-bg p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-mono text-xl font-bold uppercase tracking-tight">
                  {editingBrand ? 'Edit Brand' : 'New Brand'}
                </h2>
                <button onClick={handleCloseModal} className="p-1 hover:bg-line/10">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full border border-line bg-bg p-2 font-mono text-sm focus:border-ink focus:outline-none"
                    placeholder="e.g. Nike"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-xs font-bold uppercase tracking-wider text-ink/60">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full border border-line bg-bg p-2 font-mono text-sm focus:border-ink focus:outline-none"
                    placeholder="e.g. nike"
                  />
                </div>

                <div className="space-y-1">
                  <CloudinaryUpload
                    label="Brand Logo"
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    onRemove={() => setFormData({ ...formData, image_url: '' })}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 bg-ink p-3 font-mono text-sm font-bold uppercase tracking-widest text-bg hover:bg-ink/90 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {editingBrand ? 'Update Brand' : 'Create Brand'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
