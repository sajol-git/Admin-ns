'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product, Category, Brand } from '@/types';
import Image from 'next/image';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Wand2, 
  Loader2, 
  X,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Star
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().min(0, 'Stock must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  status: z.enum(['published', 'draft']),
  is_featured: z.boolean(),
  isFlashSale: z.boolean(),
  image_url: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsClient({ 
  initialProducts,
  categories = [],
  brands = []
}: { 
  initialProducts: Product[],
  categories?: Category[],
  brands?: Brand[]
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'draft',
      is_featured: false,
      isFlashSale: false,
      stock: 0,
      price: 0,
    }
  });

  // Auto-generate slug from name
  const name = watch('name');
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    setValue('slug', value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        brand: product.brand,
        status: product.status,
        is_featured: product.is_featured,
        isFlashSale: product.isFlashSale || false,
        image_url: product.image_url,
      });
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        category: categories[0]?.name || '',
        brand: brands[0]?.name || '',
        status: 'draft',
        is_featured: false,
        isFlashSale: false,
        image_url: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', editingProduct.id);
        if (error) throw error;
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...data } : p));
      } else {
        const { data: newProducts, error } = await supabase
          .from('products')
          .insert([data])
          .select()
          .limit(1);
        if (error) throw error;
        const newProduct = newProducts?.[0];
        if (newProduct) setProducts([newProduct, ...products]);
      }
      closeModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      setError(`Failed to save product: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteConfirmId);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product.');
    }
  };

  const generateDescription = async () => {
    const name = watch('name');
    const category = watch('category');
    const brand = watch('brand');
    
    if (!name) {
      setError('Please enter a product name first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, brand }),
      });
      
      if (!response.ok) throw new Error('Failed to generate');
      
      const { description } = await response.json();
      setValue('description', description);
    } catch (error) {
      console.error('Error generating description:', error);
      setError('Failed to generate description.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search products by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 pl-11 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            />
          </div>
          <div className="flex rounded-2xl border border-gray-200 bg-gray-50/50 p-1.5 shadow-inner">
            <button 
              onClick={() => setViewMode('table')}
              className={`rounded-xl p-2 transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              title="Table View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`rounded-xl p-2 transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Add New Product
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category & Brand</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-200" />
                        <p>No products found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                            {product.image_url ? (
                              <Image 
                                src={product.image_url} 
                                alt={product.name}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-gray-900 truncate max-w-[200px]">{product.name}</span>
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{product.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 font-medium">{product.category}</span>
                          <span className="text-xs text-gray-500">{product.brand}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                          product.stock < 10 
                            ? 'bg-red-50 text-red-700 border border-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${
                          product.status === 'published' 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openModal(product)} 
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" 
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)} 
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full p-20 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/30 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-white shadow-sm">
                  <Search className="h-8 w-8 text-gray-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">No products found</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                </div>
              </div>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <ImageIcon className="h-12 w-12" />
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.is_featured && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-400 text-white text-[10px] font-bold px-2.5 py-1 shadow-lg shadow-amber-400/20 uppercase tracking-wider">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </div>
                    )}
                    <div className={`rounded-full text-[10px] font-bold px-2.5 py-1 shadow-lg uppercase tracking-wider ${
                      product.status === 'published' 
                        ? 'bg-indigo-600 text-white shadow-indigo-600/20' 
                        : 'bg-white text-gray-600 shadow-black/5'
                    }`}>
                      {product.status}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <button 
                      onClick={() => openModal(product)}
                      className="rounded-2xl bg-white p-3.5 text-gray-900 hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-90"
                      title="Edit Product"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="rounded-2xl bg-white p-3.5 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-90"
                      title="Delete Product"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                        {product.brand}
                      </div>
                      <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    <div className="text-lg font-black text-gray-900">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{product.stock} in stock</span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {product.category}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {editingProduct ? 'Update your product information and visuals' : 'Create a new product for your store'}
                  </p>
                </div>
                <button 
                  onClick={closeModal} 
                  className="p-2 rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex px-8 border-b border-gray-50 bg-white">
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`relative py-4 px-6 text-sm font-bold transition-all ${
                    activeTab === 'edit' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Edit Details
                  {activeTab === 'edit' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`relative py-4 px-6 text-sm font-bold transition-all ${
                    activeTab === 'preview' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Visual Preview
                  {activeTab === 'preview' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full"
                    />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === 'edit' ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Product Name</label>
                        <input
                          {...register('name')}
                          onChange={handleNameChange}
                          placeholder="e.g. Premium Wireless Headphones"
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 p-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                        {errors.name && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider ml-1">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Slug</label>
                        <input
                          {...register('slug')}
                          placeholder="product-slug-auto-generated"
                          className="w-full rounded-2xl border border-gray-200 bg-gray-100/50 p-4 text-sm font-medium text-gray-500 cursor-not-allowed focus:outline-none"
                          readOnly
                        />
                        {errors.slug && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider ml-1">{errors.slug.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Category</label>
                        <select
                          {...register('category')}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 p-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                        {errors.category && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider ml-1">{errors.category.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Brand</label>
                        <select
                          {...register('brand')}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 p-4 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                        >
                          <option value="">Select Brand</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>{brand.name}</option>
                          ))}
                        </select>
                        {errors.brand && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider ml-1">{errors.brand.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Price ($)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            {...register('price', { valueAsNumber: true })}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 pl-8 pr-4 py-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                          />
                        </div>
                        {errors.price && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider ml-1">{errors.price.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Stock Units</label>
                        <input
                          type="number"
                          {...register('stock', { valueAsNumber: true })}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                        />
                        {errors.stock && <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider ml-1">{errors.stock.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Description</label>
                        <button
                          type="button"
                          onClick={generateDescription}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 disabled:opacity-50 uppercase tracking-widest transition-all"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          {isGenerating ? 'Generating...' : 'Magic Write'}
                        </button>
                      </div>
                      <textarea
                        {...register('description')}
                        rows={6}
                        placeholder="Describe your product features, benefits, and specifications..."
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/30 p-5 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Product Visuals</label>
                      <div className="rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/30 p-2">
                        <CloudinaryUpload
                          label=""
                          value={watch('image_url') || ''}
                          onChange={(url) => setValue('image_url', url)}
                          onRemove={() => setValue('image_url', null)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/30 cursor-pointer hover:bg-white hover:border-indigo-100 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${watch('is_featured') ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                            <Star className={`h-4 w-4 ${watch('is_featured') ? 'fill-current' : ''}`} />
                          </div>
                          <span className="text-sm font-bold text-gray-700">Featured</span>
                        </div>
                        <input type="checkbox" {...register('is_featured')} className="h-5 w-5 rounded-lg border-gray-200 text-indigo-600 focus:ring-indigo-500/20 transition-all" />
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/30 cursor-pointer hover:bg-white hover:border-indigo-100 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${watch('isFlashSale') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                            <Plus className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-700">Flash Sale</span>
                        </div>
                        <input type="checkbox" {...register('isFlashSale')} className="h-5 w-5 rounded-lg border-gray-200 text-indigo-600 focus:ring-indigo-500/20 transition-all" />
                      </label>

                      <div className="flex flex-col gap-2">
                        <div className="flex rounded-2xl border border-gray-100 bg-gray-50/50 p-1.5 shadow-inner">
                          {['draft', 'published'].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setValue('status', s as any)}
                              className={`flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                                watch('status') === s 
                                  ? 'bg-white text-indigo-600 shadow-sm' 
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-50">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-2xl px-8 py-4 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
                      >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSaving ? 'Saving Changes...' : (editingProduct ? 'Update Product' : 'Create Product')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="relative aspect-square rounded-[2.5rem] border border-gray-100 bg-gray-50 overflow-hidden shadow-inner">
                        {watch('image_url') ? (
                          <Image 
                            src={watch('image_url') || ''} 
                            alt="Preview" 
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                            <ImageIcon className="h-20 w-20 mb-4 opacity-20" />
                            <span className="text-sm font-bold uppercase tracking-widest opacity-50">No Image Preview</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center space-y-8">
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 uppercase tracking-widest border border-indigo-100">
                              {watch('brand') || 'Brand'}
                            </span>
                            <span className="rounded-full bg-gray-50 text-gray-500 text-[10px] font-black px-3 py-1 uppercase tracking-widest border border-gray-100">
                              {watch('category') || 'Category'}
                            </span>
                          </div>
                          <h1 className="text-4xl font-black text-gray-900 mb-4 leading-tight">
                            {watch('name') || 'Product Name'}
                          </h1>
                          <div className="text-3xl font-black text-indigo-600">
                            ${(watch('price') || 0).toFixed(2)}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</div>
                            <div className="font-bold text-gray-900">{watch('stock') || 0} Units</div>
                          </div>
                          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Featured</div>
                            <div className="font-bold text-gray-900">{watch('is_featured') ? 'Yes' : 'No'}</div>
                          </div>
                          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Flash</div>
                            <div className="font-bold text-gray-900">{watch('isFlashSale') ? 'Yes' : 'No'}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <div className={`h-3 w-3 rounded-full ${watch('status') === 'published' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-300'}`} />
                          <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Status: {watch('status')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Description</h3>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                      <div 
                        className="prose prose-indigo max-w-none text-gray-600 leading-relaxed font-medium"
                        dangerouslySetInnerHTML={{ __html: watch('description') || '<p className="italic text-gray-400">No description provided yet. Use the Magic Write tool to generate one!</p>' }}
                      />
                    </div>
                  </div>
                )}
              </div>
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
              <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Delete Product?</h3>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                This action cannot be undone. All data associated with this product will be permanently removed.
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

      {/* Error Toast/Modal */}
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
    </div>
  );
}
