'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Product } from '@/types';
import { Plus, Search, Edit2, Trash2, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: 'draft',
      is_featured: false,
      stock: 0,
      price: 0,
    }
  });

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
      });
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        slug: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        brand: '',
        status: 'draft',
        is_featured: false,
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
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    }
  };

  const generateDescription = async () => {
    const name = watch('name');
    const category = watch('category');
    const brand = watch('brand');
    
    if (!name) {
      alert('Please enter a product name first.');
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
      alert('Failed to generate description.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-line bg-bg pl-10 pr-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-ink text-bg px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      <div className="border border-line bg-bg shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_100px] p-4 border-b border-line bg-line/5">
            <div className="col-header">Product Name</div>
            <div className="col-header">Category</div>
            <div className="col-header text-right">Price</div>
            <div className="col-header text-right">Stock</div>
            <div className="col-header text-center">Status</div>
            <div className="col-header text-right">Actions</div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center font-mono opacity-50">No products found.</div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-[1fr_1fr_100px_100px_100px_100px] p-4 border-b border-line items-center hover:bg-line/5 transition-colors">
                <div className="font-mono font-bold truncate pr-4">{product.name}</div>
                <div className="font-mono text-sm opacity-70 truncate pr-4">{product.category}</div>
                <div className="font-mono text-right">${product.price.toFixed(2)}</div>
                <div className="font-mono text-right">
                  <span className={`px-2 py-1 text-xs ${product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {product.stock}
                  </span>
                </div>
                <div className="font-mono text-center">
                  <span className={`px-2 py-1 text-[10px] uppercase tracking-wider ${product.status === 'published' ? 'border border-ink' : 'border border-line border-dashed opacity-50'}`}>
                    {product.status}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => openModal(product)} className="p-1 hover:bg-line/10 transition-colors" title="Edit">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-1 hover:bg-red-100 text-red-600 transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-line bg-bg shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-mono font-bold tracking-tighter">
                {editingProduct ? 'EDIT_PRODUCT' : 'NEW_PRODUCT'}
              </h2>
              <button onClick={closeModal} className="font-mono text-sm uppercase tracking-wider hover:underline">
                [Close]
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="col-header block">Name</label>
                  <input {...register('name')} className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink" />
                  {errors.name && <p className="text-red-500 text-xs font-mono">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="col-header block">Slug</label>
                  <input {...register('slug')} className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink" />
                  {errors.slug && <p className="text-red-500 text-xs font-mono">{errors.slug.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="col-header block">Category</label>
                  <input {...register('category')} className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink" />
                  {errors.category && <p className="text-red-500 text-xs font-mono">{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="col-header block">Brand</label>
                  <input {...register('brand')} className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink" />
                  {errors.brand && <p className="text-red-500 text-xs font-mono">{errors.brand.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="col-header block">Price ($)</label>
                  <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink" />
                  {errors.price && <p className="text-red-500 text-xs font-mono">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="col-header block">Stock</label>
                  <input type="number" {...register('stock', { valueAsNumber: true })} className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink" />
                  {errors.stock && <p className="text-red-500 text-xs font-mono">{errors.stock.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="col-header block">Description</label>
                  <button 
                    type="button" 
                    onClick={generateDescription}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider hover:underline disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    Auto-Generate
                  </button>
                </div>
                <textarea 
                  {...register('description')} 
                  rows={4} 
                  className="w-full border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink resize-y" 
                />
                {errors.description && <p className="text-red-500 text-xs font-mono">{errors.description.message}</p>}
              </div>

              <div className="flex gap-6">
                <div className="space-y-2">
                  <label className="col-header block">Status</label>
                  <select {...register('status')} className="border border-line bg-transparent p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ink">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="space-y-2 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('is_featured')} className="w-4 h-4 border-line bg-transparent checked:bg-ink" />
                    <span className="col-header">Featured Product</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-line">
                <button type="button" onClick={closeModal} className="px-4 py-2 font-mono text-sm uppercase tracking-wider hover:bg-line/10 transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-ink text-bg px-6 py-2 font-mono text-sm uppercase tracking-wider hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
